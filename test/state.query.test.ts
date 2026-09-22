import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import State, { StateStatus } from '../src/models/state.model.js';
import { getStatesForAgreementVersion } from '../src/controllers/state.controller.js';
import { validateGetStatesQuery } from '../src/middlewares/state.validator.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import * as agreementVersionService from '../src/services/agreementVersion.service.js';

const from = '2026-09-22T10:00:00.000Z';
const to = '2026-09-22T11:00:00.000Z';
const path =
    '/organizations/org/scopes/scope/agreementCollections/collection/agreementVersions/1/states';
const app = express();
app.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states',
    validateGetStatesQuery,
    getStatesForAgreementVersion,
);
app.use(errorHandler);

afterEach(() => vi.restoreAllMocks());

describe('State updatedAt range retrieval', () => {
    beforeEach(async () => {
        const signatureId = new Types.ObjectId();
        vi.spyOn(agreementVersionService, 'getAgreementVersionBySelector').mockResolvedValue({
            versionNumber: 1,
            contract: { signatures: [{ signatureId }, { signatureId: new Types.ObjectId() }] },
        } as never);

        for (const [index, updatedAt] of [
            '2026-09-22T09:59:59.999Z',
            from,
            '2026-09-22T10:30:00.000Z',
            to,
        ].entries()) {
            const state = await State.create({
                signatureId,
                generationId: `generation-${index}`,
                startDate: new Date('2026-01-01T00:00:00.000Z'),
                date: new Date(`2026-01-0${index + 1}T00:00:00.000Z`),
                consolidated: false,
                status: StateStatus.IN_PROGRESS,
                numericExpression: '1',
                comparator: '>=',
                threshold: 1,
                window: { anchorDate: new Date('2026-01-01'), period: [{ unit: 'day', value: 1 }] },
                metrics: [],
            });
            // Set the fixture's update time without Mongoose replacing it with the current time.
            await State.collection.updateOne(
                { _id: state._id },
                { $set: { updatedAt: new Date(updatedAt) } },
            );
        }
    });

    it.each([
        { query: {}, expected: [0, 1, 2, 3] },
        { query: { updatedFrom: from }, expected: [1, 2, 3] },
        { query: { updatedTo: to }, expected: [0, 1, 2] },
        { query: { updatedFrom: from, updatedTo: to }, expected: [1, 2] },
        { query: { updatedFrom: from, updatedTo: from }, expected: [] },
        { query: { updatedFrom: '2027-01-01T00:00:00Z' }, expected: [] },
        { query: { updatedFrom: '2026-09-22T12:00:00+02:00', updatedTo: to }, expected: [1, 2] },
    ])(
        'filters by updatedAt and preserves the response structure: $query',
        async ({ query, expected }) => {
            const response = await request(app).get(path).query(query);
            expect(response.status).toBe(200);
            const version = response.body.data.agreementVersion;
            expect(version.versionNumber).toBe(1);
            expect(version.contract.signatures).toHaveLength(2);
            expect(
                version.contract.signatures[0].states
                    .map((state: { generationId: string }) => state.generationId)
                    .sort(),
            ).toEqual(expected.map((index) => `generation-${index}`));
            expect(version.contract.signatures[1].states).toEqual([]);
        },
    );

    it.each([
        { updatedFrom: 'invalid' },
        { updatedTo: '' },
        { updatedFrom: '2026-02-30T00:00:00Z' },
        { updatedFrom: to, updatedTo: from },
        { updatedFrom: [from, to] },
        { updatedTo: 'null' },
    ])('rejects an invalid range before querying States: %j', async (query) => {
        const response = await request(app).get(path).query(query);
        expect(response.status).toBe(400);
        expect(agreementVersionService.getAgreementVersionBySelector).not.toHaveBeenCalled();
    });
});
