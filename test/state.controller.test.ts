import { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as stateController from '../src/controllers/state.controller.js';
import * as stateService from '../src/services/state.service.js';
import { ComplianceStatus } from '../src/models/state.model.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('state generation controller', () => {
    it('returns 207 when a synchronous result is indeterminate', async () => {
        vi.spyOn(stateService, 'generateStatesForAgreementVersion').mockResolvedValue([
            { complianceStatus: ComplianceStatus.INDETERMINATE },
        ] as never);
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const request = {
            params: {
                orgName: 'organization-name',
                scopeId: 'scope-id',
                agColId: 'agreement-collection-id',
                agreementVersion: '1',
            },
            body: {
                date: '2026-08-24T00:00:00.000Z',
                temporalMode: 'REPLAY',
                ifExists: 'KEEP',
            },
            query: {},
        } as unknown as Request;
        const response = { status } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;

        await stateController.generateStatesForAgreementVersion(request, response, next);

        expect(status).toHaveBeenCalledWith(207);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('consolidation state task controller', () => {
    it('defaults enabled to true and forwards the signature selection', async () => {
        const signatureIds = ['69cbea571d5009a043619276'];
        const createTasksSpy = vi
            .spyOn(stateService, 'createConsolidationStateTasksForAgreementVersion')
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
            body: { signatureIds },
            query: {},
        } as unknown as Request;
        const response = { status } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;

        await stateController.createConsolidationStateTasksForAgreementVersion(
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
            signatureIds,
        );
        expect(status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('reads enabled from the query when the body is omitted', async () => {
        const createTasksSpy = vi
            .spyOn(stateService, 'createConsolidationStateTasksForAgreementVersion')
            .mockResolvedValue([]);
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const request = {
            params: {
                orgName: 'organization-name',
                scopeId: 'scope-id',
                agColId: 'agreement-collection-id',
                agreementVersion: '1',
            },
            body: undefined,
            query: { enabled: 'false' },
        } as unknown as Request;
        const response = { status } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;

        await stateController.createConsolidationStateTasksForAgreementVersion(
            request,
            response,
            next,
        );

        expect(createTasksSpy).toHaveBeenCalledWith(
            'organization-name',
            'scope-id',
            'agreement-collection-id',
            '1',
            false,
            undefined,
        );
        expect(status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('gets the consolidated-state tasks for the selected agreement version', async () => {
        const tasks = [{ _id: 'task-id' }];
        const getTasksSpy = vi
            .spyOn(stateService, 'getConsolidationStateTasksForAgreementVersion')
            .mockResolvedValue(tasks);
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const request = {
            params: {
                orgName: 'organization-name',
                scopeId: 'scope-id',
                agColId: 'agreement-collection-id',
                agreementVersion: '2',
            },
        } as unknown as Request;
        const response = { status } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;

        await stateController.getConsolidationStateTasksForAgreementVersion(
            request,
            response,
            next,
        );

        expect(getTasksSpy).toHaveBeenCalledWith(
            'organization-name',
            'scope-id',
            'agreement-collection-id',
            '2',
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('deletes the consolidated-state tasks for the selected agreement version', async () => {
        const deletionResult = { deletedTasksCount: 2, deletedExecutionsCount: 4 };
        const deleteTasksSpy = vi
            .spyOn(stateService, 'deleteConsolidationStateTasksForAgreementVersion')
            .mockResolvedValue(deletionResult);
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const request = {
            params: {
                orgName: 'organization-name',
                scopeId: 'scope-id',
                agColId: 'agreement-collection-id',
                agreementVersion: 'auditableVersion',
            },
        } as unknown as Request;
        const response = { status } as unknown as Response;
        const next = vi.fn() as unknown as NextFunction;

        await stateController.deleteConsolidationStateTasksForAgreementVersion(
            request,
            response,
            next,
        );

        expect(deleteTasksSpy).toHaveBeenCalledWith(
            'organization-name',
            'scope-id',
            'agreement-collection-id',
            'auditableVersion',
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});
