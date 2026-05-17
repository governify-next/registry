import * as stateRepository from '../repositories/state.repository.js';
import * as agreementVersionService from './agreementVersion.service.js';
import * as evaluatorService from './evaluator.service.js';
import * as windowUtil from '../utils/window.util.js';
import * as computerIntegration from '../integrations/computer.integration.js';
import * as collectorIntegrations from '../integrations/collector.integration.js';
import { IState, StateStatus } from '../models/state.model.js';
import { Types } from 'mongoose';
import { IAssembledGuarantee } from '../types/assembledGuarantee.types.js';
import { IComputedMetric, IFetcherConfig } from '../types/metric.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger().setTag('state.service.ts');

export const generateState = async (
    isAsync: boolean,
    date: Date,
    signatureId: string,
    guarantee: IAssembledGuarantee,
): Promise<IState> => {
    const initialState = await createInitialState(signatureId, guarantee, date);
    const computeMetricsAndEvaluateState = async () => {
        try {
            const processedMetrics: IComputedMetric[] = [];
            for (const metric of guarantee.metrics) {
                const processedMetric = await computerIntegration.computeMetric(
                    date,
                    guarantee.window,
                    metric.event,
                    metric.aggregation,
                );
                processedMetrics.push({
                    metricName: metric.metricName,
                    value: processedMetric.value,
                    evidences: processedMetric.evidences,
                    metricConfig: processedMetric.metricConfig,
                });
                // If metric returns a null value, we stop the calculation for the guarantee
                if (processedMetric.value === null) {
                    break;
                }
            }
            return await evaluateState(
                initialState._id.toString(),
                processedMetrics,
                guarantee.numericExpression,
                guarantee.comparator,
                guarantee.threshold,
            );
        } catch (error) {
            await stateRepository.updateStateById(initialState._id.toString(), {
                endDate: new Date(),
                status: StateStatus.FAILED,
            });
            throw error;
        }
    };
    if (isAsync) {
        // Async
        void computeMetricsAndEvaluateState().catch((error) => {
            logger.error(
                `Async state generation failed for state ${initialState._id.toString()}: ${
                    error instanceof Error ? error.message : 'Unknown state generation error'
                }`,
            );
        });
        return initialState;
    }
    return await computeMetricsAndEvaluateState(); // Sync
};

export const createInitialState = async (
    signatureId: string,
    guarantee: IAssembledGuarantee,
    date: Date,
) => {
    return stateRepository.createState({
        signatureId: new Types.ObjectId(signatureId),
        startDate: new Date(),
        endDate: null,
        date: date,
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
        metrics: guarantee.metrics,
    });
};

export const evaluateState = async (
    id: string,
    processedMetrics: IComputedMetric[],
    numericExpression: string,
    comparator: string,
    threshold: number,
): Promise<IState> => {
    // If any of the metrics has a null value, it has not been computed correctly and is indeterminate.
    const hasUnavailableMetricValue = processedMetrics.some((metric) => metric.value === null);
    const numericExpressionValue = hasUnavailableMetricValue
        ? null
        : evaluatorService.evaluateNumericExpression(numericExpression, processedMetrics);
    const updatedState = await stateRepository.updateStateById(id, {
        endDate: new Date(),
        status: StateStatus.COMPLETED,
        replacedNumericExpression: hasUnavailableMetricValue
            ? null
            : evaluatorService.replaceExpressionWithValues(numericExpression, processedMetrics),
        numericExpressionValue: numericExpressionValue,
        compliant:
            numericExpressionValue === null
                ? null
                : evaluatorService.evaluateCompliance(
                      numericExpressionValue,
                      comparator,
                      threshold,
                  ),
        indeterminate: numericExpressionValue === null,
        metrics: Object.values(processedMetrics),
    });
    if (!updatedState) {
        throw new Error(`State not found for id: ${id}`);
    }
    return updatedState;
};

export const updateStateById = async (id: string, data: Partial<IState>) => {
    return await stateRepository.updateStateById(id, data);
};

export const generateStatesForAuditableVersion = async (
    isAsync: boolean,
    orgName: string,
    elementName: string,
    agColName: string,
    date: Date,
) => {
    const auditableAgreementVersion = await agreementVersionService.getAuditableVersionByCollection(
        orgName,
        elementName,
        agColName,
        true,
    );
    const signatures =
        'signatures' in auditableAgreementVersion!.contract
            ? auditableAgreementVersion!.contract.signatures
            : [];

    // await prefetchFetchResults(
    //     date,
    //     signatures.flatMap((signature) =>
    //         signature.guarantee.metrics.flatMap((metric) => metric.event.fetcherConfigs),
    //     ),
    // );

    const states: Array<IState> = [];
    await Promise.all(
        signatures.map(async (signature) => {
            const existingState = await getExistingState(signature.signatureId.toString(), date);
            if (existingState) {
                states.push(existingState);
                return;
            }
            const state = await generateState(
                isAsync,
                date,
                signature.signatureId.toString(),
                signature.guarantee,
            );
            states.push(state);
        }),
    );
    return states;
};

export const getStatesForAuditableVersion = async (
    orgName: string,
    elementName: string,
    agColName: string,
) => {
    const auditableAgreementVersion = await agreementVersionService.getAuditableVersionByCollection(
        orgName,
        elementName,
        agColName,
        true,
    );
    const signatures =
        'signatures' in auditableAgreementVersion!.contract
            ? auditableAgreementVersion!.contract.signatures
            : [];
    // For each signature, get states and return as array of arrays of states
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
        elementName: elementName,
        agreementCollectionName: agColName,
        agreementVersion: {
            ...auditableAgreementVersion,
            contract: {
                ...auditableAgreementVersion!.contract,
                signatures: signatureStates,
            },
        },
    };
};

const getExistingState = async (signatureId: string, date: Date) => {
    return await stateRepository.getStateBySignatureIdAndDate(signatureId, date);
};

const buildFetchResultKey = (fetcherConfig: IFetcherConfig) => {
    return JSON.stringify({
        fetcherId: fetcherConfig.fetcherId,
        fetcherConfig: fetcherConfig.fetcherConfig,
    });
};

const prefetchFetchResults = async (date: Date, fetcherConfigs: IFetcherConfig[]) => {
    const uniqueFetches = new Map<string, IFetcherConfig>();

    for (const fetcherConfig of fetcherConfigs) {
        const key = buildFetchResultKey(fetcherConfig);

        uniqueFetches.set(key, fetcherConfig);
    }

    await Promise.all(
        [...uniqueFetches.values()].map((fetcherConfig) =>
            collectorIntegrations.generateFetchResult(
                fetcherConfig.fetcherId,
                date,
                fetcherConfig.fetcherConfig!,
            ),
        ),
    );
};
