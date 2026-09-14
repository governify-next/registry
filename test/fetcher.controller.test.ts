import { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fetcherController from '../src/controllers/fetcher.controller.js';
import * as fetcherService from '../src/services/fetcher.service.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('consolidation fetch task controller', () => {
    it('forwards the scopeId route parameter to the service', async () => {
        const createTasksSpy = vi
            .spyOn(fetcherService, 'createConsolidationFetchTasksForAgreementVersion')
            .mockResolvedValue([]);
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const request = {
            params: {
                orgName: 'organization-name',
                scopeId: 'scope-id',
                agColId: 'agreement-collection-id',
                agreementVersion: 'auditableVersion',
            },
            query: {},
        } as unknown as Request;
        const response = { status } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;

        await fetcherController.createConsolidationFetchTasksForAgreementVersion(
            request,
            response,
            next,
        );

        expect(createTasksSpy).toHaveBeenCalledWith(
            'organization-name',
            'scope-id',
            'agreement-collection-id',
            'auditableVersion',
            true,
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});
