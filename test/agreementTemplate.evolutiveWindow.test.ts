import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { agreementTemplateRoutes } from '../src/routes/agreementTemplate.routes.js';
import * as scopeManager from '../src/integrations/scope-manager.integration.js';
import Guarantee from '../src/models/guarantee.model.js';
import GuaranteeTemplate from '../src/models/guaranteeTemplate.model.js';
import {
    assembleBySignature,
    createSignaturesByVersion,
} from '../src/services/signature.service.js';
import type { IAgreementVersion } from '../src/models/agreementCollection.model.js';
import { sendError } from '../src/utils/standardResponse.js';

const url = '/organizations/demo/agreementTemplates';
const window = { period: [{ unit: 'hour', value: 1 }], anchorDate: '2026-09-20T22:00:00.000Z' };
const evolutiveWindow = { ...window, period: [{ unit: 'minute', value: 20 }] };
const payload = () => ({
    name: 'test-template',
    displayName: 'Test',
    description: 'Test windows',
    isPublic: true,
    guarantees: [
        {
            guaranteeTemplateName: 'GUARANTEE',
            comparator: '>=',
            threshold: 75,
            window,
            evolutiveWindow,
        },
    ],
});
const app = express();
app.use(express.json(), agreementTemplateRoutes);
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    return sendError(res, error);
});

beforeEach(async () => {
    vi.spyOn(scopeManager, 'getOrganizationByName').mockResolvedValue({
        _id: new Types.ObjectId(),
    } as never);
    await GuaranteeTemplate.create({
        name: 'GUARANTEE',
        info: { title: 'Test' },
        numericExpression: '1',
        metrics: [],
    });
});
afterEach(() => vi.restoreAllMocks());

describe('agreement template evolutive windows', () => {
    it.each([evolutiveWindow, null])(
        'persists and returns the submitted evolutive window %j',
        async (value) => {
            const body = payload();
            const response = await request(app)
                .post(url)
                .send({ ...body, guarantees: [{ ...body.guarantees[0], evolutiveWindow: value }] });
            expect(response.status).toBe(201);
            expect(response.body.data.guarantees[0].evolutiveWindow).toEqual(value);
            const read = await request(app).get(`${url}/${body.name}`);
            expect(read.body.data.guarantees[0].evolutiveWindow).toEqual(value);
            const stored = await Guarantee.findOne().lean();
            expect(stored?.evolutiveWindow?.anchorDate ?? null).toEqual(
                value ? new Date(value.anchorDate) : null,
            );

            const signatures = await createSignaturesByVersion(
                [
                    {
                        guaranteeName: 'GUARANTEE',
                        metrics: [],
                        visualizationConfig: { label: 'Team' },
                    },
                ],
                stored!.agreementTemplateId,
            );
            const version = {
                versionNumber: 1,
                contract: {
                    agreementTemplateId: stored!.agreementTemplateId,
                    signaturesId: signatures.map((s) => s._id),
                    validity: {},
                },
            } as IAgreementVersion;
            const expanded = await assembleBySignature(version);
            expect(
                JSON.parse(
                    JSON.stringify(expanded.contract.signatures[0].guarantee.evolutiveWindow),
                ),
            ).toEqual(value);
        },
    );

    it.each([
        ['missing', undefined],
        ['empty object', {}],
        ['array', []],
        ['string', '20m'],
        ['missing anchor', { period: evolutiveWindow.period }],
        ['invalid anchor', { ...evolutiveWindow, anchorDate: 'invalid' }],
        ['anchor too early', { ...evolutiveWindow, anchorDate: '1999-01-01T00:00:00Z' }],
        ['anchor too late', { ...evolutiveWindow, anchorDate: '2101-01-01T00:00:00Z' }],
        ['empty period', { ...evolutiveWindow, period: [] }],
        ['null period', { ...evolutiveWindow, period: null }],
        ['missing unit', { ...evolutiveWindow, period: [{ value: 20 }] }],
        ['unknown unit', { ...evolutiveWindow, period: [{ unit: 'month', value: 1 }] }],
        ['missing value', { ...evolutiveWindow, period: [{ unit: 'minute' }] }],
        ['zero value', { ...evolutiveWindow, period: [{ unit: 'minute', value: 0 }] }],
        ['negative value', { ...evolutiveWindow, period: [{ unit: 'minute', value: -1 }] }],
        ['fractional value', { ...evolutiveWindow, period: [{ unit: 'minute', value: 0.5 }] }],
        ['equal duration', { ...evolutiveWindow, period: [{ unit: 'minute', value: 60 }] }],
        ['larger duration', { ...evolutiveWindow, period: [{ unit: 'hour', value: 2 }] }],
        [
            'equal composite duration',
            {
                ...evolutiveWindow,
                period: [
                    { unit: 'minute', value: 59 },
                    { unit: 'second', value: 60 },
                ],
            },
        ],
    ])('rejects %s on POST and PUT', async (_label, value) => {
        const body = payload();
        const invalid = {
            ...body,
            guarantees: [{ ...body.guarantees[0], evolutiveWindow: value }],
        };
        for (const method of ['post', 'put'] as const) {
            const response = await request(app)
                [method](method === 'post' ? url : `${url}/${body.name}`)
                .send(invalid);
            expect(response.status).toBe(400);
            expect(response.body.error.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: expect.stringMatching(/^guarantees\[0\]/) }),
                ]),
            );
        }
        expect(await Guarantee.countDocuments()).toBe(0);
    });

    it('compares sums with different units and independent anchors', async () => {
        const body = payload();
        body.guarantees[0].window = {
            ...window,
            period: [
                { unit: 'minute', value: 40 },
                { unit: 'second', value: 30 },
            ],
        };
        body.guarantees[0].evolutiveWindow = {
            anchorDate: '2026-09-21T12:00:00.000Z',
            period: [
                { unit: 'minute', value: 40 },
                { unit: 'second', value: 29 },
            ],
        };
        expect((await request(app).post(url).send(body)).status).toBe(201);
    });

    it('accepts null and a configured window in separate guarantees without skipping validation', async () => {
        await GuaranteeTemplate.create({
            name: 'SECOND',
            info: { title: 'Second' },
            numericExpression: '1',
            metrics: [],
        });
        const body = payload();
        const guarantees = [
            { ...body.guarantees[0], evolutiveWindow: null },
            { ...body.guarantees[0], guaranteeTemplateName: 'SECOND' },
        ];
        const created = await request(app)
            .post(url)
            .send({ ...body, guarantees });
        expect(created.status).toBe(201);
        const changed = await request(app)
            .put(`${url}/${body.name}`)
            .send({
                ...body,
                guarantees: guarantees.map((g) => ({ ...g, evolutiveWindow: null })),
            });
        expect(changed.status).toBe(200);
        expect(
            changed.body.data.guarantees.every(
                (g: { evolutiveWindow: unknown }) => g.evolutiveWindow === null,
            ),
        ).toBe(true);
        guarantees[1].evolutiveWindow = window;
        const rejected = await request(app)
            .put(`${url}/${body.name}`)
            .send({ ...body, guarantees });
        expect(rejected.status).toBe(400);
        expect((await Guarantee.find().lean()).every((g) => g.evolutiveWindow === null)).toBe(true);
    });

    it('still requires a valid consolidation window when evolutiveWindow is null', async () => {
        const body = payload();
        const response = await request(app)
            .post(url)
            .send({
                ...body,
                guarantees: [{ ...body.guarantees[0], window: null, evolutiveWindow: null }],
            });
        expect(response.status).toBe(400);
    });

    it('requires the field in the model while allowing an explicit null', () => {
        const data = {
            ...payload().guarantees[0],
            position: 0,
            agreementTemplateId: new Types.ObjectId(),
            guaranteeTemplateId: new Types.ObjectId(),
        };
        expect(
            new Guarantee({ ...data, evolutiveWindow: undefined }).validateSync()?.errors
                .evolutiveWindow,
        ).toBeDefined();
        expect(new Guarantee({ ...data, evolutiveWindow: null }).validateSync()).toBeUndefined();
    });
});
