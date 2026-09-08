import { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as agreementVersionController from '../src/controllers/agreementVersion.controller.js';
import * as agreementVersionService from '../src/services/agreementVersion.service.js';

afterEach(() => {
    vi.restoreAllMocks();
});

const createResponse = () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    return { response: { status } as unknown as Response, status };
};

describe('agreement version selector controller', () => {
    it('gets a numeric one-based agreementVersion selector', async () => {
        const getAgreementVersionSpy = vi
            .spyOn(agreementVersionService, 'getAgreementVersionBySelector')
            .mockResolvedValue({ versionNumber: 9 } as never);
        const request = {
            params: {
                orgName: 'organization',
                scopeId: 'scope',
                agColId: 'agreement-collection-id',
                agreementVersion: '2',
            },
            query: { expand: 'true' },
        } as unknown as Request;
        const { response, status } = createResponse();
        const next = vi.fn() as unknown as NextFunction;

        await agreementVersionController.getAgreementVersionByCollection(request, response, next);

        expect(getAgreementVersionSpy).toHaveBeenCalledWith(
            'organization',
            'scope',
            'agreement-collection-id',
            '2',
            true,
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards auditableVersion unchanged when deleting', async () => {
        const deleteAgreementVersionSpy = vi
            .spyOn(agreementVersionService, 'deleteAgreementVersionBySelector')
            .mockResolvedValue(null);
        const request = {
            params: {
                orgName: 'organization',
                scopeId: 'scope',
                agColId: 'agreement-collection-id',
                agreementVersion: 'auditableVersion',
            },
        } as unknown as Request;
        const { response, status } = createResponse();
        const next = vi.fn() as unknown as NextFunction;

        await agreementVersionController.deleteAgreementVersionByCollection(
            request,
            response,
            next,
        );

        expect(deleteAgreementVersionSpy).toHaveBeenCalledWith(
            'organization',
            'scope',
            'agreement-collection-id',
            'auditableVersion',
        );
        expect(status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});
