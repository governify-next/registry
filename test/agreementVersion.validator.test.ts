import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateCreateAgreementVersion } from '../src/middlewares/agreementVersion.validator.js';
import * as agreementTemplateService from '../src/services/agreementTemplate.service.js';
import * as guaranteeService from '../src/services/guarantee.service.js';
import * as guaranteeTemplateService from '../src/services/guaranteeTemplate.service.js';
import * as scopeManagerIntegration from '../src/integrations/scope-manager.integration.js';
import * as computerIntegration from '../src/integrations/computer.integration.js';
import { sendError } from '../src/utils/standardResponse.js';

const guaranteeName = 'NUMBER_INPROGRESS_ISSUES_PER_MEMBER2';
const metricName = 'COUNT_INPROGRESSISSUES_MEMBER';

const requestBody = {
    contract: {
        agreementTemplateName: 'agreement-template',
        validity: {
            timezone: 'Europe/Madrid',
            initial: '2026-01-01T00:00:00.000Z',
            end: '2026-12-31T23:59:59.999Z',
        },
    },
    signatures: [
        {
            guaranteeName,
            metrics: [
                {
                    metricName,
                    fetcherConfigs: [
                        {
                            fetcherId: 'FETCHER',
                            fetcherConfig: {},
                        },
                    ],
                    processConfig: {},
                },
            ],
        },
    ],
};

const createValidationApp = () => {
    const app = express();
    const handler = vi.fn((_req: Request, res: Response) => res.status(204).send());
    app.use(express.json());
    app.post('/:orgName', validateCreateAgreementVersion, handler);
    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        void _next;
        return sendError(res, error);
    });
    return { app, handler };
};

const mockAgreementTemplate = () => {
    const organizationId = new Types.ObjectId();
    const agreementTemplateId = new Types.ObjectId();
    vi.spyOn(scopeManagerIntegration, 'getOrganizationByName').mockResolvedValue({
        _id: organizationId,
    } as never);
    vi.spyOn(agreementTemplateService, 'getCleanAgreementTemplateByOrganization').mockResolvedValue(
        { _id: agreementTemplateId } as never,
    );
    return agreementTemplateId;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('agreement version signature guarantees', () => {
    it('rejects a globally existing GuaranteeTemplate that is not in the AgreementTemplate', async () => {
        const agreementTemplateId = mockAgreementTemplate();
        const requestedGuaranteeTemplateId = new Types.ObjectId();
        vi.spyOn(guaranteeTemplateService, 'findGuaranteeTemplatesByName').mockResolvedValue([
            {
                _id: requestedGuaranteeTemplateId,
                name: guaranteeName,
                metrics: [
                    {
                        metricName,
                        metricConfig: { event: { eventId: 'EVENT' } },
                    },
                ],
            },
        ] as never);
        vi.spyOn(guaranteeService, 'getGuaranteesByAgreementTemplateId').mockResolvedValue([
            {
                agreementTemplateId,
                guaranteeTemplateId: new Types.ObjectId(),
            },
        ] as never);
        const validateEventConfigSpy = vi.spyOn(computerIntegration, 'validateEventConfig');
        const { app, handler } = createValidationApp();

        const response = await request(app).post('/organization').send(requestBody);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain(
            `GuaranteeTemplates are not configured in AgreementTemplate 'agreement-template'`,
        );
        expect(response.body.error.details).toEqual({
            agreementTemplateName: 'agreement-template',
            guaranteeNames: [guaranteeName],
        });
        expect(validateEventConfigSpy).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
    });

    it('keeps returning not found for a GuaranteeTemplate that does not exist', async () => {
        mockAgreementTemplate();
        vi.spyOn(guaranteeTemplateService, 'findGuaranteeTemplatesByName').mockResolvedValue([]);
        const getConfiguredGuaranteesSpy = vi.spyOn(
            guaranteeService,
            'getGuaranteesByAgreementTemplateId',
        );
        const validateEventConfigSpy = vi.spyOn(computerIntegration, 'validateEventConfig');
        const { app, handler } = createValidationApp();

        const response = await request(app).post('/organization').send(requestBody);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(`GuaranteeTemplates not found: ${guaranteeName}`);
        expect(getConfiguredGuaranteesSpy).not.toHaveBeenCalled();
        expect(validateEventConfigSpy).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
    });

    it('validates all configured signature metrics in parallel', async () => {
        const agreementTemplateId = mockAgreementTemplate();
        const requestedGuaranteeTemplateId = new Types.ObjectId();
        const bodyWithMultipleMetrics = structuredClone(requestBody);
        bodyWithMultipleMetrics.signatures[0].metrics = Array.from({ length: 12 }, (_, index) => ({
            metricName,
            fetcherConfigs: [
                {
                    fetcherId: 'FETCHER',
                    fetcherConfig: {},
                },
            ],
            processConfig: { index },
        }));
        vi.spyOn(guaranteeTemplateService, 'findGuaranteeTemplatesByName').mockResolvedValue([
            {
                _id: requestedGuaranteeTemplateId,
                name: guaranteeName,
                metrics: [
                    {
                        metricName,
                        metricConfig: { event: { eventId: 'EVENT' } },
                    },
                ],
            },
        ] as never);
        vi.spyOn(guaranteeService, 'getGuaranteesByAgreementTemplateId').mockResolvedValue([
            {
                agreementTemplateId,
                guaranteeTemplateId: requestedGuaranteeTemplateId,
            },
        ] as never);
        let activeComputerCalls = 0;
        let maximumConcurrentComputerCalls = 0;
        const validateEventConfigSpy = vi
            .spyOn(computerIntegration, 'validateEventConfig')
            .mockImplementation(async () => {
                activeComputerCalls += 1;
                maximumConcurrentComputerCalls = Math.max(
                    maximumConcurrentComputerCalls,
                    activeComputerCalls,
                );
                await new Promise((resolve) => setTimeout(resolve, 5));
                activeComputerCalls -= 1;
                return null;
            });
        const { app, handler } = createValidationApp();

        const response = await request(app).post('/organization').send(bodyWithMultipleMetrics);

        expect(response.status, JSON.stringify(response.body)).toBe(204);
        expect(validateEventConfigSpy).toHaveBeenCalledTimes(12);
        expect(maximumConcurrentComputerCalls).toBe(12);
        expect(handler).toHaveBeenCalledOnce();
    });

    it('returns every complete Computer validation error in the response', async () => {
        const agreementTemplateId = mockAgreementTemplate();
        const requestedGuaranteeTemplateId = new Types.ObjectId();
        const bodyWithInvalidConfigs = structuredClone(requestBody);
        bodyWithInvalidConfigs.signatures[0].metrics = Array.from({ length: 3 }, (_, index) => ({
            metricName,
            fetcherConfigs: [
                {
                    fetcherId: 'FETCHER',
                    fetcherConfig: {},
                },
            ],
            processConfig: { index },
        }));
        vi.spyOn(guaranteeTemplateService, 'findGuaranteeTemplatesByName').mockResolvedValue([
            {
                _id: requestedGuaranteeTemplateId,
                name: guaranteeName,
                metrics: [
                    {
                        metricName,
                        metricConfig: { event: { eventId: 'EVENT' } },
                    },
                ],
            },
        ] as never);
        vi.spyOn(guaranteeService, 'getGuaranteesByAgreementTemplateId').mockResolvedValue([
            {
                agreementTemplateId,
                guaranteeTemplateId: requestedGuaranteeTemplateId,
            },
        ] as never);
        vi.spyOn(computerIntegration, 'validateEventConfig').mockImplementation(
            async (_eventId, _fetcherConfigs, processConfig) =>
                processConfig.index === 2
                    ? {
                          error: 'Invalid processConfig',
                          issues: [
                              {
                                  source: 'processConfig',
                                  path: ['username'],
                                  message: 'Required',
                              },
                          ],
                      }
                    : {
                          error: 'Invalid fetcherConfig',
                          issues: [
                              {
                                  source: 'fetcherConfig',
                                  fetcherId: 'FETCHER',
                                  path: ['token'],
                                  message: 'Required',
                              },
                          ],
                      },
        );
        const { app, handler } = createValidationApp();

        const response = await request(app).post('/organization').send(bodyWithInvalidConfigs);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Signature validation failed');
        expect(response.body.error.message).toBe('Signature validation failed');
        expect(response.body.error.details.signatureErrors).toEqual([
            expect.objectContaining({
                signatureIndex: 0,
                metricIndex: 0,
                guaranteeName,
                metricName,
                eventId: 'EVENT',
                reason: 'Invalid fetcherConfig',
                issues: [expect.objectContaining({ source: 'fetcherConfig', path: ['token'] })],
            }),
            expect.objectContaining({
                signatureIndex: 0,
                metricIndex: 1,
                guaranteeName,
                metricName,
                eventId: 'EVENT',
                reason: 'Invalid fetcherConfig',
                issues: [expect.objectContaining({ source: 'fetcherConfig', path: ['token'] })],
            }),
            expect.objectContaining({
                signatureIndex: 0,
                metricIndex: 2,
                guaranteeName,
                metricName,
                eventId: 'EVENT',
                reason: 'Invalid processConfig',
                issues: [expect.objectContaining({ source: 'processConfig', path: ['username'] })],
            }),
        ]);
        expect(handler).not.toHaveBeenCalled();
    });
});
