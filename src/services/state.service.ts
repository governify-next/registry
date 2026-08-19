import { Types } from 'mongoose';
import * as stateRepository from '../repositories/state.repository.js';
import * as agreementVersionService from './agreementVersion.service.js';
import * as evaluatorService from './evaluator.service.js';
import * as windowUtil from '../utils/window.util.js';
import * as computerIntegration from '../integrations/computer.integration.js';
import * as directorIntegration from '../integrations/director.integration.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';
import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import { IState, StateStatus } from '../models/state.model.js';
import { IAssembledGuarantee } from '../types/assembledGuarantee.types.js';
import { IMetric, MetricStatus } from '../types/metric.types.js';
import { Comparator } from '../types/comparator.types.js';
import { getLogger } from '../utils/logger.js';
import { ExistingStatePolicy, ITemporalContext, TemporalMode } from '../types/temporal.types.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

const logger = getLogger().setTag('state.service.ts');

export const generateState = async (
    isAsync: boolean,
    temporalContext: ITemporalContext,
    signatureId: string,
    guarantee: IAssembledGuarantee,
    existingStatePolicy: ExistingStatePolicy,
): Promise<IState> => {
    const { state: initialState, shouldCompute } = await createInitialState(
        signatureId,
        guarantee,
        temporalContext.effectiveAt,
        existingStatePolicy,
    );

    if (!shouldCompute) {
        return initialState;
    }

    const generationId = initialState.generationId;
    const computeMetricsAndEvaluateState = async () => {
        try {
            const processedMetrics = await Promise.all(
                guarantee.metrics.map(async (metric): Promise<IMetric> => {
                    try {
                        const processedMetric = await computerIntegration.computeMetric(
                            temporalContext,
                            guarantee.window,
                            metric.metricConfig.event,
                            metric.metricConfig.aggregation,
                        );
                        return {
                            metricName: metric.metricName,
                            status: processedMetric.status,
                            value: processedMetric.value,
                            evidences: processedMetric.evidences,
                            errorMessage: null,
                            metricConfig: processedMetric.metricConfig,
                        };
                    } catch (error) {
                        return {
                            metricName: metric.metricName,
                            status: MetricStatus.FAILED,
                            value: null,
                            evidences: [],
                            errorMessage:
                                error instanceof Error ? error.message : 'Unknown metric error',
                            metricConfig: metric.metricConfig,
                        };
                    }
                }),
            );

            return await evaluateState(
                initialState._id.toString(),
                generationId,
                processedMetrics,
                guarantee.numericExpression,
                guarantee.comparator,
                guarantee.threshold,
            );
        } catch (error) {
            await stateRepository.updateStateByIdAndGenerationId(
                initialState._id.toString(),
                generationId,
                {
                    endDate: new Date(),
                    status: StateStatus.FAILED,
                    indeterminate: true,
                },
            );
            throw error;
        }
    };

    if (isAsync) {
        void computeMetricsAndEvaluateState().catch((error) => {
            logger.error(
                `Async state generation failed for state ${initialState._id.toString()}: ${
                    error instanceof Error ? error.message : 'Unknown state generation error'
                }`,
            );
        });
        return initialState;
    }

    return await computeMetricsAndEvaluateState();
};

export const createInitialState = async (
    signatureId: string,
    guarantee: IAssembledGuarantee,
    date: Date,
    existingStatePolicy: ExistingStatePolicy,
) => {
    const generationId = new Types.ObjectId().toString();
    const initialStateData = {
        signatureId: new Types.ObjectId(signatureId),
        generationId,
        attempt: 1,
        startDate: new Date(),
        endDate: null,
        date,
        consolidated: windowUtil.isConsolidated(
            date,
            guarantee.window.anchorDate,
            guarantee.window.period,
        ),
        status: StateStatus.IN_PROGRESS,
        numericExpression: guarantee.numericExpression,
        comparator: guarantee.comparator,
        threshold: guarantee.threshold,
        replacedNumericExpression: null,
        numericExpressionValue: null,
        compliant: null,
        indeterminate: null,
        window: guarantee.window,
        metrics: guarantee.metrics.map((metric) => ({
            metricName: metric.metricName,
            status: MetricStatus.PENDING,
            value: null,
            evidences: [],
            errorMessage: null,
            metricConfig: metric.metricConfig,
        })),
    };

    const state =
        existingStatePolicy === ExistingStatePolicy.REPLACE
            ? await stateRepository.replaceState(initialStateData)
            : await stateRepository.claimState(initialStateData);

    if (!state) {
        throw new Error(
            `Failed to claim state for signature ${signatureId} at ${date.toISOString()}`,
        );
    }

    return {
        state,
        shouldCompute:
            existingStatePolicy === ExistingStatePolicy.REPLACE ||
            state.generationId === generationId,
    };
};

export const evaluateState = async (
    id: string,
    generationId: string,
    processedMetrics: IMetric[],
    numericExpression: string,
    comparator: Comparator,
    threshold: number,
): Promise<IState> => {
    const hasFailedMetric = processedMetrics.some(
        (metric) => metric.status === MetricStatus.FAILED,
    );
    const hasUnavailableMetric = processedMetrics.some(
        (metric) => metric.status === MetricStatus.UNAVAILABLE,
    );
    const canEvaluate = !hasFailedMetric && !hasUnavailableMetric;
    const numericExpressionValue = canEvaluate
        ? evaluatorService.evaluateNumericExpression(numericExpression, processedMetrics)
        : null;
    const indeterminate = !canEvaluate || numericExpressionValue === null;

    const updatedState = await stateRepository.updateStateByIdAndGenerationId(id, generationId, {
        endDate: new Date(),
        status: hasFailedMetric ? StateStatus.FAILED : StateStatus.COMPLETED,
        replacedNumericExpression: indeterminate
            ? null
            : evaluatorService.replaceExpressionWithValues(numericExpression, processedMetrics),
        numericExpressionValue,
        compliant:
            numericExpressionValue === null
                ? null
                : evaluatorService.evaluateCompliance(
                      numericExpressionValue,
                      comparator,
                      threshold,
                  ),
        indeterminate,
        metrics: processedMetrics,
    });

    if (updatedState) {
        return updatedState;
    }

    const currentState = await stateRepository.getStateById(id);
    if (!currentState) {
        throw new Error(`State not found for id: ${id}`);
    }
    return currentState;
};

export const updateStateById = async (id: string, data: Partial<IState>) => {
    return await stateRepository.updateStateById(id, data);
};

export const generateStatesForAgreementVersion = async (
    isAsync: boolean,
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
    temporalContext: ITemporalContext,
    existingStatePolicy: ExistingStatePolicy,
    signatureIds?: string[],
) => {
    const selectedAgreementVersion = await agreementVersionService.getAgreementVersionBySelector(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
        true,
        signatureIds,
    );
    const agreementSignatures =
        'signatures' in selectedAgreementVersion!.contract
            ? selectedAgreementVersion!.contract.signatures
            : [];
    const signatures = selectSignatures(agreementSignatures, signatureIds);

    return await Promise.all(
        signatures.map((signature) =>
            generateState(
                isAsync,
                temporalContext,
                signature.signatureId.toString(),
                signature.guarantee,
                existingStatePolicy,
            ),
        ),
    );
};

export const generateConsolidatedStatesForAgreementVersion = async (
    isAsync: boolean,
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
    startDate: Date,
    endDate: Date,
    temporalMode: TemporalMode,
    existingStatePolicy: ExistingStatePolicy,
    signatureIds?: string[],
) => {
    const selectedAgreementVersion = await agreementVersionService.getAgreementVersionBySelector(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
        true,
        signatureIds,
    );

    const agreementSignatures =
        'signatures' in selectedAgreementVersion!.contract
            ? selectedAgreementVersion!.contract.signatures
            : [];
    const signatures = selectSignatures(agreementSignatures, signatureIds);

    const statesBySignature = await Promise.all(
        signatures.map(async (signature) => {
            const consolidationDates = windowUtil.getConsolidationDatesInRange(
                startDate,
                endDate,
                signature.guarantee.window.anchorDate,
                signature.guarantee.window.period,
            );
            const states: IState[] = [];

            for (const date of consolidationDates) {
                states.push(
                    await generateState(
                        isAsync,
                        { effectiveAt: date, mode: temporalMode },
                        signature.signatureId.toString(),
                        signature.guarantee,
                        existingStatePolicy,
                    ),
                );
            }

            return states;
        }),
    );

    return statesBySignature.flat();
};

const selectSignatures = <TSignature extends { signatureId: { toString(): string } }>(
    signatures: TSignature[],
    signatureIds?: string[],
): TSignature[] => {
    if (signatureIds === undefined) {
        return signatures;
    }

    const availableIds = new Set(
        signatures.map((signature) => signature.signatureId.toString().toLowerCase()),
    );
    const unknownSignatureIds = signatureIds.filter(
        (signatureId) => !availableIds.has(signatureId.toLowerCase()),
    );

    if (unknownSignatureIds.length > 0) {
        throw new ValidationError(
            'Some signatureIds do not belong to the selected agreement version',
            { unknownSignatureIds },
        );
    }

    const selectedIds = new Set(signatureIds.map((signatureId) => signatureId.toLowerCase()));
    return signatures.filter((signature) =>
        selectedIds.has(signature.signatureId.toString().toLowerCase()),
    );
};

export const createConsolidationStateTasksForAgreementVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
    enabled: boolean,
    signatureIds?: string[],
) => {
    const selectedAgreementVersion = await agreementVersionService.getAgreementVersionBySelector(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
        true,
        signatureIds,
    );
    const agreementSignatures =
        'signatures' in selectedAgreementVersion.contract
            ? selectedAgreementVersion.contract.signatures
            : [];
    const selectedSignatures = selectSignatures(agreementSignatures, signatureIds);

    const [organization, scope] = await Promise.all([
        scopeManagerIntegration.getOrganizationByName(orgName),
        scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId),
    ]);
    const agreementCollection = await agreementCollectionRepository.getAgreementCollectionByScope(
        scope!._id,
        agColName,
    );

    const agreementVersionIndex = agreementCollection!.agreementVersions.findIndex(
        (candidateAgreementVersion) =>
            candidateAgreementVersion.versionNumber === selectedAgreementVersion.versionNumber,
    );
    if (agreementVersionIndex === -1) {
        throw new NotFoundError('Selected agreement version not found in this collection');
    }

    const resolvedAgreementVersion = agreementVersionIndex + 1;
    const orgId = organization!._id.toString();
    const resolvedScopeId = scope!._id.toString();
    const agColId = agreementCollection!._id.toString();
    const startDate = new Date(selectedAgreementVersion.contract.validity.initial);
    const validityEndDate = new Date(selectedAgreementVersion.contract.validity.end);
    const earlyTermination = selectedAgreementVersion.contract.validity.earlyTermination;
    const earlyTerminationDate = earlyTermination ? new Date(earlyTermination) : validityEndDate;
    const endDate = earlyTerminationDate < validityEndDate ? earlyTerminationDate : validityEndDate;

    return await Promise.all(
        selectedSignatures.map((signature) => {
            const interval = windowUtil.fromPeriodToMilliseconds(signature.guarantee.window.period);
            const windowAnchorDate = new Date(signature.guarantee.window.anchorDate);
            const firstConsolidationDate = new Date(windowAnchorDate.getTime() + interval);
            const inputArgs = {
                orgName,
                scopeId: resolvedScopeId,
                agColName,
                orgId,
                agColId,
                agreementVersion: resolvedAgreementVersion,
                signatureId: signature.signatureId.toString(),
            };

            return directorIntegration.createRecurringStateTask(
                inputArgs,
                enabled,
                startDate,
                endDate,
                firstConsolidationDate,
                interval,
            );
        }),
    );
};

const getConsolidationStateTaskFiltersForAgreementVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
): Promise<directorIntegration.IDirectorTaskFilters> => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId);
    const agreementCollection = await agreementCollectionRepository.getAgreementCollectionByScope(
        scope!._id,
        agColName,
    );
    const selectedAgreementVersion = agreementVersionService.resolveAgreementVersionSelector(
        agreementCollection!,
        agreementVersion,
    );
    const agreementVersionIndex =
        agreementCollection!.agreementVersions.indexOf(selectedAgreementVersion);
    if (agreementVersionIndex === -1) {
        throw new NotFoundError('Selected agreement version not found in this collection');
    }

    return {
        script: 'generateConsolidatedStates',
        inputArgs: {
            agColId: agreementCollection!._id.toString(),
            agreementVersion: agreementVersionIndex + 1,
        },
    };
};

export const getConsolidationStateTasksForAgreementVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
) => {
    const filters = await getConsolidationStateTaskFiltersForAgreementVersion(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
    );
    return await directorIntegration.getTasksByFilters(filters);
};

export const deleteConsolidationStateTasksForAgreementVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
) => {
    const filters = await getConsolidationStateTaskFiltersForAgreementVersion(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
    );
    return await directorIntegration.deleteTasksByFilters(filters);
};

export const getStatesForAgreementVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    agreementVersion: string,
) => {
    const selectedAgreementVersion = await agreementVersionService.getAgreementVersionBySelector(
        orgName,
        scopeId,
        agColName,
        agreementVersion,
        true,
    );
    const signatures =
        'signatures' in selectedAgreementVersion.contract
            ? selectedAgreementVersion.contract.signatures
            : [];
    const signatureStates = [];
    for (const signature of signatures) {
        const states = await stateRepository.getStatesBySignatureId(
            signature.signatureId.toString(),
        );
        signatureStates.push({
            ...signature,
            states,
        });
    }
    return {
        organizationName: orgName,
        scopeId,
        agreementCollectionName: agColName,
        agreementVersion: {
            ...selectedAgreementVersion,
            contract: {
                ...selectedAgreementVersion.contract,
                signatures: signatureStates,
            },
        },
    };
};
