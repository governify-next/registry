import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as agreementCollectionRepository from '../src/repositories/agreementCollection.repository.js';
import * as agreementVersionService from '../src/services/agreementVersion.service.js';
import * as directorIntegration from '../src/integrations/director.integration.js';
import * as fetcherService from '../src/services/fetcher.service.js';
import * as scopeManagerIntegration from '../src/integrations/scope-manager.integration.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('consolidation fetch tasks', () => {
    it('creates Director fetchFetcher tasks with scope metadata', async () => {
        const orgId = new Types.ObjectId();
        const scopeId = new Types.ObjectId();
        const agColId = new Types.ObjectId();
        const anchorDate = new Date('2026-08-01T00:00:00.000Z');
        const startDate = new Date('2026-08-01T00:00:00.000Z');
        const endDate = new Date('2026-09-01T00:00:00.000Z');

        const agreementVersionSpy = vi
            .spyOn(agreementVersionService, 'getAgreementVersionBySelector')
            .mockResolvedValue({
                versionNumber: 3,
                contract: {
                    validity: { initial: startDate, end: endDate },
                    signatures: [
                        {
                            guarantee: {
                                window: {
                                    anchorDate,
                                    period: [{ unit: 'day', value: 1 }],
                                },
                                metrics: [
                                    {
                                        metricConfig: {
                                            event: {
                                                fetcherConfigs: [
                                                    {
                                                        fetcherId: 'FT_GQL_ZENHUB_ISSUES',
                                                        fetcherConfig: {
                                                            workspaceId: 'workspace-id',
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            } as never);
        vi.spyOn(scopeManagerIntegration, 'getOrganizationByName').mockResolvedValue({
            _id: orgId,
        });
        const scopeSpy = vi
            .spyOn(scopeManagerIntegration, 'getScopeByOrgAndScopeId')
            .mockResolvedValue({ _id: scopeId });
        vi.spyOn(agreementCollectionRepository, 'getAgreementCollectionByScope').mockResolvedValue({
            _id: agColId,
        } as never);
        const createTaskSpy = vi
            .spyOn(directorIntegration, 'createRecurringFetchTask')
            .mockResolvedValue({ _id: new Types.ObjectId() });

        await fetcherService.createConsolidationFetchTasksForAgreementVersion(
            'organization-name',
            scopeId.toString(),
            agColId.toString(),
            '1',
            true,
        );

        expect(agreementVersionSpy).toHaveBeenCalledWith(
            'organization-name',
            scopeId.toString(),
            agColId.toString(),
            '1',
            true,
        );
        expect(scopeSpy).toHaveBeenCalledWith('organization-name', scopeId.toString());
        expect(createTaskSpy).toHaveBeenCalledWith(
            {
                fetcherId: 'FT_GQL_ZENHUB_ISSUES',
                fetcherConfig: { workspaceId: 'workspace-id' },
                orgId: orgId.toString(),
                scopeId: scopeId.toString(),
                agColId: agColId.toString(),
                versionNumber: 3,
            },
            true,
            startDate,
            endDate,
            anchorDate,
            86_400_000,
        );
    });
});
