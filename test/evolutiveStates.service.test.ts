import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as states from '../src/services/state.service.js';
import * as versions from '../src/services/agreementVersion.service.js';
import * as computer from '../src/integrations/computer.integration.js';
import * as director from '../src/integrations/director.integration.js';
import * as scopeManager from '../src/integrations/scope-manager.integration.js';
import * as collections from '../src/repositories/agreementCollection.repository.js';
import State, { StateStatus } from '../src/models/state.model.js';
import { MetricStatus } from '../src/types/metric.types.js';
import { TemporalMode, ExistingStatePolicy } from '../src/types/temporal.types.js';
import type { IAssembledGuarantee } from '../src/types/assembledGuarantee.types.js';
import { getEvolutiveDatesInRange } from '../src/utils/window.util.js';

const anchor = new Date('2026-09-20T00:00:00Z');
const at = (minutes: number) => new Date(anchor.getTime() + minutes * 60_000);
const guarantee: IAssembledGuarantee = {
    name: 'Practice',
    numericExpression: 'count',
    comparator: '>=',
    threshold: 1,
    window: { anchorDate: anchor, period: [{ unit: 'hour', value: 1 }] },
    evolutiveWindow: { anchorDate: anchor, period: [{ unit: 'minute', value: 20 }] },
    metrics: [
        {
            metricName: 'count',
            metricConfig: {
                event: { eventId: 'EVENT', fetcherConfigs: [], processConfig: {} },
                aggregation: { aggregatorType: 'count', aggregatorConfig: {} },
            },
        },
    ],
};
const fixture = () => {
    const signatures = [
        { signatureId: new Types.ObjectId(), guarantee },
        { signatureId: new Types.ObjectId(), guarantee: { ...guarantee, evolutiveWindow: null } },
    ];
    vi.spyOn(versions, 'getAgreementVersionBySelector').mockResolvedValue({
        versionNumber: 7,
        contract: {
            signatures,
            validity: { initial: at(0), end: at(240), earlyTermination: at(180) },
        },
    } as never);
    return signatures;
};
const generate = (
    start: number,
    end = start,
    policy = ExistingStatePolicy.KEEP,
    ids?: string[],
    isAsync = false,
) =>
    states.generateEvolutiveStatesForAgreementVersion(
        isAsync,
        'org',
        'scope',
        'collection',
        'auditableVersion',
        at(start),
        at(end),
        TemporalMode.REPLAY,
        policy,
        ids,
    );
afterEach(() => vi.restoreAllMocks());

describe('evolutive state generation', () => {
    it('enumerates only evolutive ticks, including boundaries, and computes against the consolidation window', async () => {
        const signatures = fixture();
        const compute = vi.spyOn(computer, 'computeMetric').mockResolvedValue({
            status: MetricStatus.COMPUTED,
            value: 1,
            evidences: [],
            metricConfig: guarantee.metrics[0].metricConfig,
        });
        const result = await generate(0, 120);
        expect(result.map((s) => s.date)).toEqual([20, 40, 80, 100].map(at));
        expect(result.every((s) => !s.consolidated && s.status === StateStatus.COMPLETED)).toBe(
            true,
        );
        expect(result.every((s) => s.signatureId.equals(signatures[0].signatureId))).toBe(true);
        expect(compute).toHaveBeenCalledTimes(4);
        for (const date of [20, 40, 80, 100].map(at)) {
            expect(compute).toHaveBeenCalledWith(
                { effectiveAt: date, mode: TemporalMode.REPLAY },
                guarantee.window,
                guarantee.metrics[0].metricConfig.event,
                guarantee.metrics[0].metricConfig.aggregation,
            );
        }
        const kept = await generate(20);
        expect(kept[0]._id).toEqual(result[0]._id);
        expect(compute).toHaveBeenCalledTimes(4);
        const replaced = await generate(20, 20, ExistingStatePolicy.REPLACE);
        expect(replaced[0].attempt).toBe(2);
        expect(compute).toHaveBeenCalledTimes(5);
    });

    it.each([0, 1, 60, -20])(
        'returns no states at an anchor, off-grid, consolidated or pre-anchor instant: %s',
        async (minute) => {
            fixture();
            expect(await generate(minute)).toEqual([]);
            expect(await State.countDocuments()).toBe(0);
        },
    );

    it('supports independent anchors and periods that do not divide the consolidation period', () => {
        const dates = getEvolutiveDatesInRange(at(0), at(160), guarantee.window, {
            anchorDate: at(10),
            period: [{ unit: 'minute', value: 25 }],
        });
        expect(dates).toEqual([35, 85, 110, 135, 160].map(at));
    });

    it('returns nothing for null windows and rejects unknown signatures before writing', async () => {
        const signatures = fixture();
        expect(
            await generate(0, 120, ExistingStatePolicy.KEEP, [
                signatures[1].signatureId.toString(),
            ]),
        ).toEqual([]);
        await expect(
            generate(0, 120, ExistingStatePolicy.KEEP, [
                signatures[0].signatureId.toString(),
                new Types.ObjectId().toString(),
            ]),
        ).rejects.toThrow('Some signatureIds');
        expect(await State.countDocuments()).toBe(0);
    });

    it('returns an initial state asynchronously and finishes calculation in the background', async () => {
        fixture();
        const gate = Promise.withResolvers<void>();
        vi.spyOn(computer, 'computeMetric').mockImplementation(async () => {
            await gate.promise;
            return {
                status: MetricStatus.COMPUTED,
                value: 1,
                evidences: [],
                metricConfig: guarantee.metrics[0].metricConfig,
            };
        });
        try {
            const result = await generate(20, 20, ExistingStatePolicy.KEEP, undefined, true);
            expect(result[0].status).toBe(StateStatus.IN_PROGRESS);
        } finally {
            gate.resolve();
        }
        await vi.waitFor(async () =>
            expect((await State.findOne())?.status).toBe(StateStatus.COMPLETED),
        );
    });
});

describe('evolutive state tasks', () => {
    const taskFixture = () => {
        const signatures = fixture();
        const scopeId = new Types.ObjectId();
        const orgId = new Types.ObjectId();
        const collectionId = new Types.ObjectId();
        vi.spyOn(scopeManager, 'getOrganizationByName').mockResolvedValue({ _id: orgId } as never);
        vi.spyOn(scopeManager, 'getScopeByOrgAndScopeId').mockResolvedValue({ _id: scopeId });
        vi.spyOn(collections, 'getAgreementCollectionByScope').mockResolvedValue({
            _id: collectionId,
            auditableVersionNumber: 7,
            agreementVersions: [{ versionNumber: 3 }, { versionNumber: 7 }],
        } as never);
        return { signatures, scopeId, orgId, collectionId };
    };
    it('uses the evolutive interval and first tick, skips null windows and respects early termination', async () => {
        const { signatures, scopeId, orgId, collectionId } = taskFixture();
        const create = vi
            .spyOn(director, 'createRecurringEvolutiveStateTask')
            .mockResolvedValue({ _id: 'task' });
        const consolidated = vi.spyOn(director, 'createRecurringStateTask');
        const result = await states.createEvolutiveStateTasksForAgreementVersion(
            'org',
            'scope',
            'collection',
            'auditableVersion',
            false,
        );
        expect(result).toEqual([{ _id: 'task' }]);
        expect(create).toHaveBeenCalledExactlyOnceWith(
            {
                orgName: 'org',
                scopeId: scopeId.toString(),
                orgId: orgId.toString(),
                agColId: collectionId.toString(),
                agreementVersion: 2,
                signatureId: signatures[0].signatureId.toString(),
            },
            false,
            at(0),
            at(180),
            at(20),
            1_200_000,
        );
        expect(consolidated).not.toHaveBeenCalled();
    });
    it('does not create tasks for a null-window selection or partially valid signature selection', async () => {
        const { signatures } = taskFixture();
        const create = vi.spyOn(director, 'createRecurringEvolutiveStateTask');
        expect(
            await states.createEvolutiveStateTasksForAgreementVersion(
                'org',
                'scope',
                'collection',
                '1',
                true,
                [signatures[1].signatureId.toString()],
            ),
        ).toEqual([]);
        await expect(
            states.createEvolutiveStateTasksForAgreementVersion(
                'org',
                'scope',
                'collection',
                '1',
                true,
                [signatures[0].signatureId.toString(), new Types.ObjectId().toString()],
            ),
        ).rejects.toThrow('Some signatureIds');
        expect(create).not.toHaveBeenCalled();
    });
    it('filters GET and DELETE by the evolutive script and resolved collection/version', async () => {
        const { collectionId } = taskFixture();
        const get = vi.spyOn(director, 'getTasksByFilters').mockResolvedValue([{ _id: 'task' }]);
        const remove = vi
            .spyOn(director, 'deleteTasksByFilters')
            .mockResolvedValue({ deletedTasksCount: 1, deletedExecutionsCount: 2 });
        expect(
            await states.getEvolutiveStateTasksForAgreementVersion(
                'org',
                'scope',
                'collection',
                'auditableVersion',
            ),
        ).toEqual([{ _id: 'task' }]);
        expect(
            await states.deleteEvolutiveStateTasksForAgreementVersion(
                'org',
                'scope',
                'collection',
                'auditableVersion',
            ),
        ).toEqual({ deletedTasksCount: 1, deletedExecutionsCount: 2 });
        const filter = {
            script: 'generateEvolutiveStates',
            inputArgs: { agColId: collectionId.toString(), agreementVersion: 2 },
        };
        expect(get).toHaveBeenCalledWith(filter);
        expect(remove).toHaveBeenCalledWith(filter);
    });
});
