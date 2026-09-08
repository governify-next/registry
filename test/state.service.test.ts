import { afterEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import * as stateService from '../src/services/state.service.js';
import * as computerIntegration from '../src/integrations/computer.integration.js';
import * as agreementVersionService from '../src/services/agreementVersion.service.js';
import * as stateRepository from '../src/repositories/state.repository.js';
import * as agreementCollectionRepository from '../src/repositories/agreementCollection.repository.js';
import * as directorIntegration from '../src/integrations/director.integration.js';
import * as scopeManagerIntegration from '../src/integrations/scope-manager.integration.js';
import { ComplianceStatus, StateStatus } from '../src/models/state.model.js';
import { MetricStatus } from '../src/types/metric.types.js';
import { ExistingStatePolicy, TemporalMode } from '../src/types/temporal.types.js';
import { IAssembledGuarantee } from '../src/types/assembledGuarantee.types.js';

const guarantee: IAssembledGuarantee = {
    name: 'Guarantee',
    numericExpression: 'available + missing',
    comparator: '>=',
    threshold: 1,
    window: {
        anchorDate: new Date('2026-01-01T00:00:00.000Z'),
        period: [{ unit: 'day', value: 1 }],
    },
    metrics: [
        {
            metricName: 'available',
            metricConfig: {
                event: {
                    eventId: 'AVAILABLE_EVENT',
                    fetcherConfigs: [],
                    processConfig: {},
                },
                aggregation: { aggregatorType: 'count', aggregatorConfig: {} },
            },
        },
        {
            metricName: 'missing',
            metricConfig: {
                event: {
                    eventId: 'MISSING_EVENT',
                    fetcherConfigs: [],
                    processConfig: {},
                },
                aggregation: { aggregatorType: 'count', aggregatorConfig: {} },
            },
        },
    ],
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('state temporal generation', () => {
    it('completes an indeterminate state and keeps every metric', async () => {
        const computeSpy = vi
            .spyOn(computerIntegration, 'computeMetric')
            .mockResolvedValueOnce({
                status: MetricStatus.COMPUTED,
                value: 1,
                evidences: [{ id: 1 }],
                metricConfig: guarantee.metrics[0].metricConfig,
            })
            .mockResolvedValueOnce({
                status: MetricStatus.UNAVAILABLE,
                value: null,
                evidences: [],
                metricConfig: {
                    ...guarantee.metrics[1].metricConfig,
                    event: {
                        ...guarantee.metrics[1].metricConfig.event,
                        fetcherConfigs: [
                            {
                                fetcherId: 'SNAPSHOT',
                                fetcherConfig: { project: 'example' },
                                fetchResult: {
                                    id: 'result-1',
                                    status: 'UNAVAILABLE',
                                    unavailableReason: 'PAST_SNAPSHOT_NOT_CAPTURED',
                                },
                            },
                        ],
                    },
                },
            });

        const state = await stateService.generateState(
            false,
            {
                effectiveAt: new Date('2026-07-01T00:00:00.000Z'),
                mode: TemporalMode.REPLAY,
            },
            new Types.ObjectId().toString(),
            guarantee,
            ExistingStatePolicy.KEEP,
        );

        expect(state.status).toBe(StateStatus.COMPLETED);
        expect(state.complianceStatus).toBe(ComplianceStatus.INDETERMINATE);
        expect(state.metrics).toHaveLength(2);
        expect(state.metrics[1].status).toBe(MetricStatus.UNAVAILABLE);
        const fetchResult = state.metrics[1].metricConfig.event.fetcherConfigs[0].fetchResult;
        expect(fetchResult?.id).toBe('result-1');
        expect(fetchResult?.status).toBe('UNAVAILABLE');
        expect(fetchResult?.unavailableReason).toBe('PAST_SNAPSHOT_NOT_CAPTURED');
        expect(computeSpy).toHaveBeenCalledTimes(2);
    });

    it('keeps an existing state and replaces it only when requested', async () => {
        const computeSpy = vi.spyOn(computerIntegration, 'computeMetric').mockResolvedValue({
            status: MetricStatus.COMPUTED,
            value: 1,
            evidences: [],
            metricConfig: guarantee.metrics[0].metricConfig,
        });
        const signatureId = new Types.ObjectId().toString();
        const temporalContext = {
            effectiveAt: new Date('2026-08-06T00:00:00.000Z'),
            mode: TemporalMode.CAPTURE,
        };

        const first = await stateService.generateState(
            false,
            temporalContext,
            signatureId,
            guarantee,
            ExistingStatePolicy.KEEP,
        );
        const kept = await stateService.generateState(
            false,
            temporalContext,
            signatureId,
            guarantee,
            ExistingStatePolicy.KEEP,
        );
        const replaced = await stateService.generateState(
            false,
            temporalContext,
            signatureId,
            guarantee,
            ExistingStatePolicy.REPLACE,
        );

        expect(kept._id.toString()).toBe(first._id.toString());
        expect(kept.generationId).toBe(first.generationId);
        expect(replaced._id.toString()).toBe(first._id.toString());
        expect(replaced.generationId).not.toBe(first.generationId);
        expect(replaced.attempt).toBe(2);
        expect(first.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
        expect(replaced.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
        expect(computeSpy).toHaveBeenCalledTimes(4);
    });

    it('stores an explicit non-compliant result', async () => {
        vi.spyOn(computerIntegration, 'computeMetric').mockResolvedValue({
            status: MetricStatus.COMPUTED,
            value: 1,
            evidences: [],
            metricConfig: guarantee.metrics[0].metricConfig,
        });

        const state = await stateService.generateState(
            false,
            {
                effectiveAt: new Date('2026-08-07T00:00:00.000Z'),
                mode: TemporalMode.CAPTURE,
            },
            new Types.ObjectId().toString(),
            { ...guarantee, threshold: 3 },
            ExistingStatePolicy.KEEP,
        );

        expect(state.status).toBe(StateStatus.COMPLETED);
        expect(state.complianceStatus).toBe(ComplianceStatus.NON_COMPLIANT);
    });

    it('stores failed generations as indeterminate', async () => {
        vi.spyOn(computerIntegration, 'computeMetric').mockRejectedValue(
            new Error('Computer unavailable'),
        );

        const state = await stateService.generateState(
            false,
            {
                effectiveAt: new Date('2026-08-08T00:00:00.000Z'),
                mode: TemporalMode.CAPTURE,
            },
            new Types.ObjectId().toString(),
            guarantee,
            ExistingStatePolicy.KEEP,
        );

        expect(state.status).toBe(StateStatus.FAILED);
        expect(state.complianceStatus).toBe(ComplianceStatus.INDETERMINATE);
        expect(state.metrics.every((metric) => metric.status === MetricStatus.FAILED)).toBe(true);
    });

    it('rejects contradictory execution and compliance statuses', async () => {
        const { state } = await stateService.createInitialState(
            new Types.ObjectId().toString(),
            guarantee,
            new Date('2026-08-09T00:00:00.000Z'),
            ExistingStatePolicy.KEEP,
        );

        expect(state.status).toBe(StateStatus.IN_PROGRESS);
        expect(state.complianceStatus).toBeNull();
        await expect(
            stateService.updateStateById(state._id.toString(), {
                status: StateStatus.COMPLETED,
            }),
        ).rejects.toThrow('status and complianceStatus must be updated together');
        await expect(
            stateService.updateStateById(state._id.toString(), {
                status: StateStatus.FAILED,
                complianceStatus: ComplianceStatus.COMPLIANT,
            }),
        ).rejects.toThrow('A FAILED state must have an INDETERMINATE compliance result');
    });

    it('generates states only for the selected signatures', async () => {
        const firstSignatureId = new Types.ObjectId();
        const secondSignatureId = new Types.ObjectId();
        const getAgreementVersionSpy = vi
            .spyOn(agreementVersionService, 'getAgreementVersionBySelector')
            .mockResolvedValue({
                versionNumber: 1,
                contract: {
                    signatures: [
                        { signatureId: firstSignatureId, guarantee },
                        { signatureId: secondSignatureId, guarantee },
                    ],
                },
            } as never);
        const computeSpy = vi.spyOn(computerIntegration, 'computeMetric').mockResolvedValue({
            status: MetricStatus.COMPUTED,
            value: 1,
            evidences: [],
            metricConfig: guarantee.metrics[0].metricConfig,
        });

        const states = await stateService.generateStatesForAgreementVersion(
            false,
            'organization',
            'scope',
            'agreement-collection-id',
            '1',
            {
                effectiveAt: new Date('2026-08-11T10:00:00.000Z'),
                mode: TemporalMode.REPLAY,
            },
            ExistingStatePolicy.KEEP,
            [secondSignatureId.toString()],
        );

        expect(states).toHaveLength(1);
        expect(states[0].signatureId.toString()).toBe(secondSignatureId.toString());
        expect(getAgreementVersionSpy).toHaveBeenCalledWith(
            'organization',
            'scope',
            'agreement-collection-id',
            '1',
            true,
            [secondSignatureId.toString()],
        );
        expect(computeSpy).toHaveBeenCalledTimes(2);
    });

    it('generates every signature when signatureIds is omitted', async () => {
        const firstSignatureId = new Types.ObjectId();
        const secondSignatureId = new Types.ObjectId();
        vi.spyOn(agreementVersionService, 'getAgreementVersionBySelector').mockResolvedValue({
            versionNumber: 1,
            contract: {
                signatures: [
                    { signatureId: firstSignatureId, guarantee },
                    { signatureId: secondSignatureId, guarantee },
                ],
            },
        } as never);
        const computeSpy = vi.spyOn(computerIntegration, 'computeMetric').mockResolvedValue({
            status: MetricStatus.COMPUTED,
            value: 1,
            evidences: [],
            metricConfig: guarantee.metrics[0].metricConfig,
        });

        const states = await stateService.generateStatesForAgreementVersion(
            false,
            'organization',
            'scope',
            'agreement-collection-id',
            'auditableVersion',
            {
                effectiveAt: new Date('2026-08-11T11:00:00.000Z'),
                mode: TemporalMode.REPLAY,
            },
            ExistingStatePolicy.KEEP,
        );

        expect(states.map((state) => state.signatureId.toString())).toEqual([
            firstSignatureId.toString(),
            secondSignatureId.toString(),
        ]);
        expect(computeSpy).toHaveBeenCalledTimes(4);
    });

    it('rejects unknown signatureIds before computing any state', async () => {
        const agreementSignatureId = new Types.ObjectId();
        const unknownSignatureId = new Types.ObjectId();
        vi.spyOn(agreementVersionService, 'getAgreementVersionBySelector').mockResolvedValue({
            versionNumber: 1,
            contract: {
                signatures: [{ signatureId: agreementSignatureId, guarantee }],
            },
        } as never);
        const computeSpy = vi.spyOn(computerIntegration, 'computeMetric');

        await expect(
            stateService.generateStatesForAgreementVersion(
                false,
                'organization',
                'scope',
                'agreement-collection-id',
                '1',
                {
                    effectiveAt: new Date('2026-08-11T10:00:00.000Z'),
                    mode: TemporalMode.REPLAY,
                },
                ExistingStatePolicy.KEEP,
                [unknownSignatureId.toString()],
            ),
        ).rejects.toMatchObject({
            httpStatus: 400,
            details: { unknownSignatureIds: [unknownSignatureId.toString()] },
        });
        expect(computeSpy).not.toHaveBeenCalled();
    });

    it('gets states for the selected agreement version', async () => {
        const signatureId = new Types.ObjectId();
        const agColId = new Types.ObjectId();
        const getAgreementVersionSpy = vi
            .spyOn(agreementVersionService, 'getAgreementVersionBySelector')
            .mockResolvedValue({
                versionNumber: 7,
                contract: {
                    signatures: [{ signatureId, guarantee }],
                },
            } as never);
        vi.spyOn(stateRepository, 'getStatesBySignatureId').mockResolvedValue([
            { status: StateStatus.COMPLETED },
        ] as never);
        const result = await stateService.getStatesForAgreementVersion(
            'organization',
            'scope',
            agColId.toString(),
            '2',
        );

        expect(getAgreementVersionSpy).toHaveBeenCalledWith(
            'organization',
            'scope',
            agColId.toString(),
            '2',
            true,
        );
        expect(result.agColId).toBe(agColId.toString());
        expect(result.agreementVersion.versionNumber).toBe(7);
        expect(result.agreementVersion.contract.signatures[0].states).toEqual([
            { status: StateStatus.COMPLETED },
        ]);
    });

    it('creates one recurring consolidation task per signature with its own window', async () => {
        const orgId = new Types.ObjectId();
        const scopeObjectId = new Types.ObjectId();
        const agColId = new Types.ObjectId();
        const firstSignatureId = new Types.ObjectId();
        const secondSignatureId = new Types.ObjectId();
        const startDate = new Date('2026-08-01T00:00:00.000Z');
        const endDate = new Date('2026-09-01T00:00:00.000Z');
        const firstAnchorDate = new Date('2026-08-01T00:00:00.000Z');
        const secondAnchorDate = new Date('2026-08-02T00:00:00.000Z');
        const firstGuarantee = {
            ...guarantee,
            window: {
                anchorDate: firstAnchorDate,
                period: [{ unit: 'day', value: 1 }],
            },
        };
        const secondGuarantee = {
            ...guarantee,
            window: {
                anchorDate: secondAnchorDate,
                period: [{ unit: 'week', value: 1 }],
            },
        };

        vi.spyOn(agreementVersionService, 'getAgreementVersionBySelector').mockResolvedValue({
            versionNumber: 7,
            contract: {
                validity: { initial: startDate, end: endDate, earlyTermination: null },
                signatures: [
                    { signatureId: firstSignatureId, guarantee: firstGuarantee },
                    { signatureId: secondSignatureId, guarantee: secondGuarantee },
                ],
            },
        } as never);
        vi.spyOn(scopeManagerIntegration, 'getOrganizationByName').mockResolvedValue({
            _id: orgId,
        });
        vi.spyOn(scopeManagerIntegration, 'getScopeByOrgAndScopeId').mockResolvedValue({
            _id: scopeObjectId,
        });
        vi.spyOn(agreementCollectionRepository, 'getAgreementCollectionByScope').mockResolvedValue({
            _id: agColId,
            name: 'agreement',
            agreementVersions: [{ versionNumber: 3 }, { versionNumber: 7 }],
        } as never);
        const createTaskSpy = vi
            .spyOn(directorIntegration, 'createRecurringStateTask')
            .mockResolvedValue({ _id: new Types.ObjectId() });

        await stateService.createConsolidationStateTasksForAgreementVersion(
            'organization',
            scopeObjectId.toString(),
            agColId.toString(),
            'auditableVersion',
            true,
        );

        expect(createTaskSpy).toHaveBeenCalledTimes(2);
        expect(createTaskSpy).toHaveBeenNthCalledWith(
            1,
            {
                orgName: 'organization',
                scopeId: scopeObjectId.toString(),
                orgId: orgId.toString(),
                agColId: agColId.toString(),
                agreementVersion: 2,
                signatureId: firstSignatureId.toString(),
            },
            true,
            startDate,
            endDate,
            new Date('2026-08-02T00:00:00.000Z'),
            86_400_000,
        );
        expect(createTaskSpy).toHaveBeenNthCalledWith(
            2,
            {
                orgName: 'organization',
                scopeId: scopeObjectId.toString(),
                orgId: orgId.toString(),
                agColId: agColId.toString(),
                agreementVersion: 2,
                signatureId: secondSignatureId.toString(),
            },
            true,
            startDate,
            endDate,
            new Date('2026-08-09T00:00:00.000Z'),
            604_800_000,
        );
    });

    it('gets and deletes only the consolidated-state tasks for the selected agreement version', async () => {
        const scopeObjectId = new Types.ObjectId();
        const agColId = new Types.ObjectId();
        const filters = {
            script: 'generateConsolidatedStates',
            inputArgs: {
                agColId: agColId.toString(),
                agreementVersion: 2,
            },
        };
        const tasks = [{ _id: new Types.ObjectId() }];
        const deletionResult = { deletedTasksCount: 1, deletedExecutionsCount: 3 };

        vi.spyOn(scopeManagerIntegration, 'getScopeByOrgAndScopeId').mockResolvedValue({
            _id: scopeObjectId,
        });
        vi.spyOn(agreementCollectionRepository, 'getAgreementCollectionByScope').mockResolvedValue({
            _id: agColId,
            auditableVersionNumber: 7,
            agreementVersions: [{ versionNumber: 3 }, { versionNumber: 7 }],
        } as never);
        const getTasksSpy = vi
            .spyOn(directorIntegration, 'getTasksByFilters')
            .mockResolvedValue(tasks);
        const deleteTasksSpy = vi
            .spyOn(directorIntegration, 'deleteTasksByFilters')
            .mockResolvedValue(deletionResult);

        await expect(
            stateService.getConsolidationStateTasksForAgreementVersion(
                'organization',
                scopeObjectId.toString(),
                agColId.toString(),
                'auditableVersion',
            ),
        ).resolves.toEqual(tasks);
        await expect(
            stateService.deleteConsolidationStateTasksForAgreementVersion(
                'organization',
                scopeObjectId.toString(),
                agColId.toString(),
                'auditableVersion',
            ),
        ).resolves.toEqual(deletionResult);

        expect(getTasksSpy).toHaveBeenCalledWith(filters);
        expect(deleteTasksSpy).toHaveBeenCalledWith(filters);
    });
});
