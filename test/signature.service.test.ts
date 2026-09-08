import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as agreementTemplateService from '../src/services/agreementTemplate.service.js';
import * as guaranteeService from '../src/services/guarantee.service.js';
import * as guaranteeTemplateService from '../src/services/guaranteeTemplate.service.js';
import * as signatureRepository from '../src/repositories/signature.repository.js';
import {
    assembleBySignature,
    createSignaturesByVersion,
} from '../src/services/signature.service.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('signature creation preflight', () => {
    it('creates no signatures when a GuaranteeTemplate is not in the AgreementTemplate', async () => {
        const agreementTemplateId = new Types.ObjectId();
        const configuredGuaranteeTemplateId = new Types.ObjectId();
        const unconfiguredGuaranteeTemplateId = new Types.ObjectId();
        const configuredGuaranteeId = new Types.ObjectId();
        const signatures = [
            { guaranteeName: 'CONFIGURED', metrics: [] },
            { guaranteeName: 'UNCONFIGURED', metrics: [] },
        ];
        vi.spyOn(guaranteeTemplateService, 'getGuaranteeTemplateByName').mockImplementation(
            async (name) =>
                ({
                    _id:
                        name === 'CONFIGURED'
                            ? configuredGuaranteeTemplateId
                            : unconfiguredGuaranteeTemplateId,
                    name,
                }) as never,
        );
        vi.spyOn(guaranteeService, 'getGuaranteeByTemplateIds').mockImplementation(
            async (_templateId, guaranteeTemplateId) =>
                guaranteeTemplateId.equals(configuredGuaranteeTemplateId)
                    ? ({ _id: configuredGuaranteeId } as never)
                    : null,
        );
        const createSignatureSpy = vi.spyOn(signatureRepository, 'createSignature');

        await expect(
            createSignaturesByVersion(signatures, agreementTemplateId),
        ).rejects.toMatchObject({
            httpStatus: 400,
            details: { guaranteeName: 'UNCONFIGURED' },
        });
        expect(createSignatureSpy).not.toHaveBeenCalled();
    });
});

describe('selective signature assembly', () => {
    it('loads and assembles only the requested signatures in agreement order', async () => {
        const firstSignatureId = new Types.ObjectId();
        const secondSignatureId = new Types.ObjectId();
        const agreementTemplateId = new Types.ObjectId();
        const guaranteeId = new Types.ObjectId();
        const guaranteeTemplateId = new Types.ObjectId();
        const selectedSignature = {
            _id: secondSignatureId,
            guaranteeId,
            metrics: [],
        };
        const agreementVersion = {
            versionNumber: 1,
            contract: {
                agreementTemplateId,
                validity: {},
                signaturesId: [firstSignatureId, secondSignatureId],
            },
        } as never;
        const getSignaturesSpy = vi
            .spyOn(signatureRepository, 'getSignaturesByIds')
            .mockResolvedValue([selectedSignature] as never);
        const resolveGuaranteeSpy = vi
            .spyOn(guaranteeService, 'resolveGuaranteeById')
            .mockResolvedValue({
                guaranteeTemplateId,
                comparator: '>=',
                threshold: 1,
                window: {
                    anchorDate: new Date('2026-01-01T00:00:00.000Z'),
                    period: [{ unit: 'day', value: 1 }],
                },
            } as never);
        const resolveGuaranteeTemplateSpy = vi
            .spyOn(guaranteeTemplateService, 'findGuaranteeTemplateById')
            .mockResolvedValue({
                name: 'Guarantee',
                info: {
                    title: 'Human-readable guarantee title',
                    description: 'Guarantee description',
                    example: 'Guarantee example',
                },
                numericExpression: 'metric',
                metrics: [],
            } as never);
        vi.spyOn(agreementTemplateService, 'resolveAgreementTemplateById').mockResolvedValue({
            name: 'Agreement template',
        } as never);

        const assembledAgreementVersion = await assembleBySignature(agreementVersion, [
            secondSignatureId.toString(),
        ]);

        expect(getSignaturesSpy).toHaveBeenCalledWith([secondSignatureId]);
        expect(resolveGuaranteeSpy).toHaveBeenCalledTimes(1);
        expect(resolveGuaranteeTemplateSpy).toHaveBeenCalledTimes(1);
        expect(assembledAgreementVersion.contract.signatures).toHaveLength(1);
        expect(assembledAgreementVersion.contract.signatures[0].signatureId).toBe(
            secondSignatureId,
        );
        expect(assembledAgreementVersion.contract.signatures[0].guarantee.info).toEqual({
            title: 'Human-readable guarantee title',
            description: 'Guarantee description',
            example: 'Guarantee example',
        });
    });

    it('rejects unknown signatureIds before querying or assembling signatures', async () => {
        const agreementSignatureId = new Types.ObjectId();
        const unknownSignatureId = new Types.ObjectId();
        const getSignaturesSpy = vi.spyOn(signatureRepository, 'getSignaturesByIds');
        const resolveGuaranteeSpy = vi.spyOn(guaranteeService, 'resolveGuaranteeById');
        const agreementVersion = {
            versionNumber: 1,
            contract: {
                agreementTemplateId: new Types.ObjectId(),
                validity: {},
                signaturesId: [agreementSignatureId],
            },
        } as never;

        await expect(
            assembleBySignature(agreementVersion, [unknownSignatureId.toString()]),
        ).rejects.toMatchObject({
            httpStatus: 400,
            details: { unknownSignatureIds: [unknownSignatureId.toString()] },
        });
        expect(getSignaturesSpy).not.toHaveBeenCalled();
        expect(resolveGuaranteeSpy).not.toHaveBeenCalled();
    });
});
