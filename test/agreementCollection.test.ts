import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AgreementCollection from '../src/models/agreementCollection.model.js';
import {
    validateCreateAgreementCollection,
    validateUpdateAgreementCollection,
} from '../src/middlewares/agreementCollection.validator.js';
import * as agreementCollectionRepository from '../src/repositories/agreementCollection.repository.js';
import * as agreementCollectionService from '../src/services/agreementCollection.service.js';
import { StdError } from '../src/utils/customErrors.js';

const baseBody = {
    name: 'agreement-collection',
    displayName: 'Agreement Collection',
    description: 'Agreement collection description',
    fields: [],
    permissions: [],
};

const createValidationApp = (
    validators: typeof validateCreateAgreementCollection | typeof validateUpdateAgreementCollection,
    method: 'post' | 'put',
) => {
    const app = express();
    app.use(express.json());
    app[method]('/:orgName/:scopeId/:agColId', validators, (_req, res) => res.status(204).send());
    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        void _next;
        const status = error instanceof StdError ? error.httpStatus : 500;
        const details = error instanceof StdError ? error.details : null;
        res.status(status).json({ details });
    });
    return app;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('agreement collection description', () => {
    it.each([
        { description: undefined, label: 'missing' },
        { description: null, label: 'null' },
        { description: 123, label: 'non-string' },
        { description: 'ab', label: 'shorter than 3 characters' },
        { description: 'a'.repeat(501), label: 'longer than 500 characters' },
    ])('rejects a $label description on creation', async ({ description }) => {
        vi.spyOn(
            agreementCollectionService,
            'getAgreementCollectionByScopeAndName',
        ).mockResolvedValue(null);
        const body: Record<string, unknown> = { ...baseBody, description };
        if (description === undefined) delete body.description;

        const response = await request(
            createValidationApp(validateCreateAgreementCollection, 'post'),
        )
            .post('/organization/scope/unused')
            .send(body);

        expect(response.status).toBe(400);
        expect(response.body.details).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: 'description' })]),
        );
    });

    it.each([
        { description: 'abc', label: 'minimum length' },
        { description: 'a'.repeat(500), label: 'maximum length' },
    ])('accepts a description at the $label', async ({ description }) => {
        vi.spyOn(
            agreementCollectionService,
            'getAgreementCollectionByScopeAndName',
        ).mockResolvedValue(null);

        const response = await request(
            createValidationApp(validateCreateAgreementCollection, 'post'),
        )
            .post('/organization/scope/unused')
            .send({ ...baseBody, description });

        expect(response.status).toBe(204);
    });

    it('checks duplicate names without treating the name as an ObjectId', async () => {
        const findByNameSpy = vi
            .spyOn(agreementCollectionService, 'getAgreementCollectionByScopeAndName')
            .mockResolvedValue(null);

        const response = await request(
            createValidationApp(validateCreateAgreementCollection, 'post'),
        )
            .post('/PSG2-2526/69cbea571d5009a043619276/unused')
            .send({ ...baseBody, name: 'tpa-US-PSG2-2526' });

        expect(response.status).toBe(204);
        expect(findByNameSpy).toHaveBeenCalledWith(
            'PSG2-2526',
            '69cbea571d5009a043619276',
            'tpa-US-PSG2-2526',
        );
    });

    it('requires description when updating an agreement collection', async () => {
        const { description: _description, ...bodyWithoutDescription } = baseBody;
        void _description;

        const response = await request(
            createValidationApp(validateUpdateAgreementCollection, 'put'),
        )
            .put('/organization/scope/69cbea571d5009a043619276')
            .send({ ...bodyWithoutDescription, auditableVersionNumber: null });

        expect(response.status).toBe(400);
        expect(response.body.details).toEqual(
            expect.arrayContaining([expect.objectContaining({ path: 'description' })]),
        );
    });

    it('marks description as required in the persistence model', async () => {
        const agreementCollection = new AgreementCollection({
            name: baseBody.name,
            displayName: baseBody.displayName,
            scopeId: '69cbea571d5009a043619276',
            fields: [],
            permissions: [],
        });

        await expect(agreementCollection.validate()).rejects.toMatchObject({
            errors: {
                description: expect.objectContaining({ kind: 'required' }),
            },
        });
    });

    it('persists description when updating an agreement collection', async () => {
        const updateSpy = vi
            .spyOn(agreementCollectionRepository, 'updateAgreementCollectionByScope')
            .mockResolvedValue(null);

        await agreementCollectionService.updateAgreementCollectionById('69cbea571d5009a043619276', {
            ...baseBody,
            auditableVersionNumber: null,
        });

        expect(updateSpy).toHaveBeenCalledWith('69cbea571d5009a043619276', {
            ...baseBody,
            auditableVersionNumber: null,
        });
    });
});
