import { afterEach, describe, expect, it, vi } from 'vitest';
import * as directorIntegration from '../src/integrations/director.integration.js';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Director state task integration', () => {
    it('creates a recurring generateConsolidatedStates task', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ success: true, data: { _id: 'task-id' } }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const startDate = new Date('2026-08-01T00:00:00.000Z');
        const endDate = new Date('2026-09-01T00:00:00.000Z');
        const anchorDate = new Date('2026-08-02T00:00:00.000Z');
        const inputArgs = {
            orgName: 'organization',
            scopeId: '69cbea571d5009a043619271',
            orgId: '69cbea571d5009a043619272',
            agColId: '69cbea571d5009a043619273',
            agreementVersion: 2,
            signatureId: '69cbea571d5009a043619276',
        };

        await directorIntegration.createRecurringStateTask(
            inputArgs,
            true,
            startDate,
            endDate,
            anchorDate,
            86_400_000,
        );

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, request] = fetchMock.mock.calls[0];
        expect(url).toBe('http://localhost:5906/api/v1/tasks');
        expect(JSON.parse(request.body)).toEqual({
            script: 'generateConsolidatedStates',
            inputArgs,
            type: 'RECURRING',
            enabled: true,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            anchorDate: anchorDate.toISOString(),
            interval: 86_400_000,
        });
    });

    it('gets consolidated-state tasks using Director filters', async () => {
        const tasks = [{ _id: 'task-id' }];
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ success: true, data: tasks }),
        });
        vi.stubGlobal('fetch', fetchMock);
        const filters = {
            script: 'generateConsolidatedStates',
            inputArgs: {
                agColId: '69cbea571d5009a043619273',
                agreementVersion: 2,
            },
        };

        await expect(directorIntegration.getTasksByFilters(filters)).resolves.toEqual(tasks);
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:5906/api/v1/tasks/search', {
            method: 'POST',
            headers: expect.any(Object),
            body: JSON.stringify(filters),
        });
    });

    it('deletes consolidated-state tasks using Director filters', async () => {
        const deletionResult = { deletedTasksCount: 2, deletedExecutionsCount: 5 };
        const fetchMock = vi.fn().mockResolvedValue({
            json: async () => ({ success: true, data: deletionResult }),
        });
        vi.stubGlobal('fetch', fetchMock);
        const filters = {
            script: 'generateConsolidatedStates',
            inputArgs: {
                agColId: '69cbea571d5009a043619273',
                agreementVersion: 2,
            },
        };

        await expect(directorIntegration.deleteTasksByFilters(filters)).resolves.toEqual(
            deletionResult,
        );
        expect(fetchMock).toHaveBeenCalledWith('http://localhost:5906/api/v1/tasks/search/delete', {
            method: 'POST',
            headers: expect.any(Object),
            body: JSON.stringify(filters),
        });
    });
});
