import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
    validateCreateConsolidationStateTasksRequest,
    validateGenerateConsolidatedStatesBody,
    validateGenerateStatesBody,
} from '../src/middlewares/state.validator.js';
import { StdError } from '../src/utils/customErrors.js';

const createValidationApp = (validators: typeof validateGenerateStatesBody) => {
    const app = express();
    app.use(express.json());
    app.post('/', validators, (_req, res) => res.status(204).send());
    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        void _next;
        const status = error instanceof StdError ? error.httpStatus : 500;
        const details = error instanceof StdError ? error.details : null;
        res.status(status).json({ details });
    });
    return app;
};

describe('state generation policy validation', () => {
    it('requires temporalMode and ifExists for regular state generation', async () => {
        const response = await request(createValidationApp(validateGenerateStatesBody))
            .post('/')
            .send({ date: '2026-08-11T10:00:00.000Z' });

        expect(response.status).toBe(400);
        expect(response.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'temporalMode' }),
                expect.objectContaining({ path: 'ifExists' }),
            ]),
        );
    });

    it('accepts explicit policies for regular state generation', async () => {
        const response = await request(createValidationApp(validateGenerateStatesBody))
            .post('/')
            .send({
                date: '2026-08-11T10:00:00.000Z',
                temporalMode: 'REPLAY',
                ifExists: 'REPLACE',
                signatureIds: ['69cbea571d5009a043619276'],
            });

        expect(response.status).toBe(204);
    });

    it('requires both policies for consolidated state generation', async () => {
        const response = await request(createValidationApp(validateGenerateConsolidatedStatesBody))
            .post('/')
            .send({ date: '2026-08-11T10:00:00.000Z' });

        expect(response.status).toBe(400);
        expect(response.body.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'temporalMode' }),
                expect.objectContaining({ path: 'ifExists' }),
            ]),
        );
    });

    it.each([
        { signatureIds: [], label: 'empty' },
        {
            signatureIds: ['69cbea571d5009a043619276', '69CBEA571D5009A043619276'],
            label: 'duplicated',
        },
        { signatureIds: ['not-an-object-id'], label: 'malformed' },
    ])('rejects $label signatureIds selections', async ({ signatureIds }) => {
        const response = await request(createValidationApp(validateGenerateStatesBody))
            .post('/')
            .send({
                date: '2026-08-11T10:00:00.000Z',
                temporalMode: 'REPLAY',
                ifExists: 'KEEP',
                signatureIds,
            });

        expect(response.status).toBe(400);
    });
});

describe('consolidation state task validation', () => {
    it('accepts an omitted body', async () => {
        const response = await request(
            createValidationApp(validateCreateConsolidationStateTasksRequest),
        ).post('/');

        expect(response.status).toBe(204);
    });

    it('accepts an omitted enabled value and a valid signature selection', async () => {
        const response = await request(
            createValidationApp(validateCreateConsolidationStateTasksRequest),
        )
            .post('/')
            .send({ signatureIds: ['69cbea571d5009a043619276'] });

        expect(response.status).toBe(204);
    });

    it.each([{ signatureIds: [] }, { signatureIds: ['not-an-object-id'] }])(
        'rejects an invalid task creation body %#',
        async (body) => {
            const response = await request(
                createValidationApp(validateCreateConsolidationStateTasksRequest),
            )
                .post('/')
                .send(body);

            expect(response.status).toBe(400);
        },
    );

    it.each(['true', 'false'])('accepts enabled=%s in the query', async (enabled) => {
        const response = await request(
            createValidationApp(validateCreateConsolidationStateTasksRequest),
        )
            .post('/')
            .query({ enabled });

        expect(response.status).toBe(204);
    });

    it('rejects an invalid enabled query value', async () => {
        const response = await request(
            createValidationApp(validateCreateConsolidationStateTasksRequest),
        )
            .post('/')
            .query({ enabled: 'yes' });

        expect(response.status).toBe(400);
    });
});
