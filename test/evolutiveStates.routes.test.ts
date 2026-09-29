import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stateRoutes } from '../src/routes/state.routes.js';
import * as states from '../src/services/state.service.js';
import * as collections from '../src/services/agreementCollection.service.js';
import * as scope from '../src/integrations/scope-manager.integration.js';
import * as computer from '../src/integrations/computer.integration.js';
import * as director from '../src/integrations/director.integration.js';
import { sendError } from '../src/utils/standardResponse.js';

const base = '/organizations/org/scopes/scope/agreementCollections/collection/agreementVersions/1';
const date = '2026-09-20T00:20:00.000Z';
const body = { date, temporalMode: 'CAPTURE', ifExists: 'KEEP' };
const app = express();
app.use(express.json(), stateRoutes);
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    return sendError(res, error);
});
beforeEach(() => {
    vi.spyOn(computer, 'checkHealth').mockResolvedValue(true);
    vi.spyOn(director, 'checkHealth').mockResolvedValue(true);
    vi.spyOn(scope, 'getScopeByOrgAndScopeId').mockResolvedValue({ _id: new Types.ObjectId() });
    vi.spyOn(collections, 'getCleanAgreementCollectionByScope').mockResolvedValue({
        agreementVersions: [{ versionNumber: 1 }],
    } as never);
});
afterEach(() => vi.restoreAllMocks());

describe('evolutive state endpoints', () => {
    it('accepts an exact date asynchronously and returns an empty successful result', async () => {
        const generate = vi
            .spyOn(states, 'generateEvolutiveStatesForAgreementVersion')
            .mockResolvedValue([]);
        const response = await request(app)
            .post(`${base}/states/evolutive/generate?isAsync=true`)
            .send(body);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(generate).toHaveBeenCalledWith(
            true,
            'org',
            'scope',
            'collection',
            '1',
            new Date(date),
            new Date(date),
            'CAPTURE',
            'KEEP',
            undefined,
        );
    });
    it('accepts a range and selection, returning 207 for synchronous indeterminate states', async () => {
        const generate = vi
            .spyOn(states, 'generateEvolutiveStatesForAgreementVersion')
            .mockResolvedValue([{ complianceStatus: 'INDETERMINATE' }] as never);
        const signatureIds = [new Types.ObjectId().toString()];
        const endDate = '2026-09-20T00:40:00.000Z';
        const response = await request(app).post(`${base}/states/evolutive/generate`).send({
            startDate: date,
            endDate,
            temporalMode: 'REPLAY',
            ifExists: 'REPLACE',
            signatureIds,
        });
        expect(response.status).toBe(207);
        expect(generate).toHaveBeenCalledWith(
            false,
            'org',
            'scope',
            'collection',
            '1',
            new Date(date),
            new Date(endDate),
            'REPLAY',
            'REPLACE',
            signatureIds,
        );
    });
    it.each([
        { date },
        { ...body, date: 'invalid' },
        { ...body, startDate: date },
        { startDate: date, temporalMode: 'CAPTURE', ifExists: 'KEEP' },
        {
            startDate: date,
            endDate: '2026-09-19T00:00:00Z',
            temporalMode: 'CAPTURE',
            ifExists: 'KEEP',
        },
        { ...body, signatureIds: [] },
        { ...body, signatureIds: ['invalid'] },
    ])('rejects invalid generation requests %# before generating states', async (invalid) => {
        const generate = vi.spyOn(states, 'generateEvolutiveStatesForAgreementVersion');
        expect(
            (await request(app).post(`${base}/states/evolutive/generate`).send(invalid)).status,
        ).toBe(400);
        expect(generate).not.toHaveBeenCalled();
    });
    it('exposes POST, GET and DELETE for evolutive tasks with the consolidated response contract', async () => {
        const create = vi
            .spyOn(states, 'createEvolutiveStateTasksForAgreementVersion')
            .mockResolvedValue([]);
        const get = vi
            .spyOn(states, 'getEvolutiveStateTasksForAgreementVersion')
            .mockResolvedValue([]);
        const remove = vi
            .spyOn(states, 'deleteEvolutiveStateTasksForAgreementVersion')
            .mockResolvedValue({ deletedTasksCount: 0 });
        const path = `${base}/tasks/states/evolutive`;
        expect((await request(app).post(path)).status).toBe(201);
        expect(create).toHaveBeenCalledWith('org', 'scope', 'collection', '1', true, undefined);
        const signatureIds = [new Types.ObjectId().toString()];
        expect(
            (
                await request(app)
                    .post(path + '?enabled=false')
                    .send({ signatureIds })
            ).status,
        ).toBe(201);
        expect(create).toHaveBeenLastCalledWith(
            'org',
            'scope',
            'collection',
            '1',
            false,
            signatureIds,
        );
        expect((await request(app).get(path)).status).toBe(200);
        expect((await request(app).delete(path)).status).toBe(200);
        for (const mock of [get, remove])
            expect(mock).toHaveBeenCalledWith('org', 'scope', 'collection', '1');
        expect((await request(app).post(path + '?enabled=wrong')).status).toBe(400);
        expect((await request(app).post(path).send({ signatureIds: [] })).status).toBe(400);
        expect(create).toHaveBeenCalledTimes(2);
    });
});
