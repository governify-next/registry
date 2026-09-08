import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as agreementCollectionService from '../src/services/agreementCollection.service.js';
import * as agreementVersionRepository from '../src/repositories/agreementVersion.repository.js';
import * as agreementVersionService from '../src/services/agreementVersion.service.js';
import * as signatureService from '../src/services/signature.service.js';
import * as agreementTemplateService from '../src/services/agreementTemplate.service.js';
import * as scopeManagerIntegration from '../src/integrations/scope-manager.integration.js';

const createAgreementVersion = (versionNumber: number) => ({
    versionNumber,
    contract: {
        agreementTemplateId: new Types.ObjectId(),
        validity: {
            timezone: 'Europe/Madrid',
            initial: new Date('2026-01-01T00:00:00.000Z'),
            end: new Date('2026-12-31T23:59:59.999Z'),
            earlyTermination: null as Date | null,
        },
        signaturesId: [new Types.ObjectId()],
    },
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('create agreement version', () => {
    it.each([
        {
            label: 'uses the current date when the previous version is currently valid',
            currentDate: '2026-06-01T12:00:00.000Z',
            initial: '2026-01-01T00:00:00.000Z',
            end: '2026-12-31T23:59:59.999Z',
            existingEarlyTermination: null,
            expectedEarlyTermination: '2026-06-01T12:00:00.000Z',
        },
        {
            label: "uses the previous version's start when it is still in the future",
            currentDate: '2025-12-01T12:00:00.000Z',
            initial: '2026-01-01T00:00:00.000Z',
            end: '2026-12-31T23:59:59.999Z',
            existingEarlyTermination: null,
            expectedEarlyTermination: '2026-01-01T00:00:00.000Z',
        },
        {
            label: 'does not terminate the previous version when it has already ended',
            currentDate: '2027-01-01T00:00:00.000Z',
            initial: '2026-01-01T00:00:00.000Z',
            end: '2026-12-31T23:59:59.999Z',
            existingEarlyTermination: null,
            expectedEarlyTermination: null,
        },
        {
            label: 'does not terminate the previous version at its exact end date',
            currentDate: '2026-12-31T23:59:59.999Z',
            initial: '2026-01-01T00:00:00.000Z',
            end: '2026-12-31T23:59:59.999Z',
            existingEarlyTermination: null,
            expectedEarlyTermination: null,
        },
        {
            label: 'does not overwrite an existing early termination',
            currentDate: '2026-06-01T12:00:00.000Z',
            initial: '2026-01-01T00:00:00.000Z',
            end: '2026-12-31T23:59:59.999Z',
            existingEarlyTermination: '2026-05-01T00:00:00.000Z',
            expectedEarlyTermination: null,
        },
    ])(
        '$label',
        async ({
            currentDate,
            initial,
            end,
            existingEarlyTermination,
            expectedEarlyTermination,
        }) => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(currentDate));

            const agreementCollectionId = new Types.ObjectId();
            const previousAgreementVersion = createAgreementVersion(1);
            previousAgreementVersion.contract.validity.initial = new Date(initial);
            previousAgreementVersion.contract.validity.end = new Date(end);
            previousAgreementVersion.contract.validity.earlyTermination = existingEarlyTermination
                ? new Date(existingEarlyTermination)
                : null;
            const latestNonAuditableVersion = createAgreementVersion(4);
            const agreementCollection = {
                _id: agreementCollectionId,
                auditableVersionNumber: previousAgreementVersion.versionNumber,
                agreementVersions: [previousAgreementVersion, latestNonAuditableVersion],
            };
            const createdAgreementVersion = createAgreementVersion(5);
            createdAgreementVersion.contract.validity.initial = new Date(
                '2030-01-01T00:00:00.000Z',
            );
            createdAgreementVersion.contract.validity.end = new Date('2030-12-31T23:59:59.999Z');

            vi.spyOn(
                agreementCollectionService,
                'getCleanAgreementCollectionByScope',
            ).mockResolvedValue(agreementCollection as never);
            vi.spyOn(scopeManagerIntegration, 'getOrganizationByName').mockResolvedValue({
                _id: new Types.ObjectId(),
            } as never);
            vi.spyOn(
                agreementTemplateService,
                'getCleanAgreementTemplateByOrganization',
            ).mockResolvedValue({
                _id: createdAgreementVersion.contract.agreementTemplateId,
            } as never);
            vi.spyOn(signatureService, 'createSignaturesByVersion').mockResolvedValue([
                { _id: createdAgreementVersion.contract.signaturesId[0] },
            ] as never);
            vi.spyOn(agreementVersionRepository, 'createAgreementVersion').mockResolvedValue({
                ...agreementCollection,
                agreementVersions: [
                    previousAgreementVersion,
                    latestNonAuditableVersion,
                    createdAgreementVersion,
                ],
            } as never);
            const updateEarlyTerminationSpy = vi
                .spyOn(agreementVersionRepository, 'updateAgreementVersionEarlyTermination')
                .mockResolvedValue(null);

            await agreementVersionService.createAgreementVersionByCollection(
                'organization',
                'scope',
                'agreement',
                {
                    contract: {
                        agreementTemplateName: 'agreement-template',
                        validity: createdAgreementVersion.contract.validity,
                    },
                    signatures: [],
                },
            );

            if (expectedEarlyTermination) {
                expect(updateEarlyTerminationSpy).toHaveBeenCalledWith(
                    agreementCollectionId,
                    previousAgreementVersion.versionNumber,
                    new Date(expectedEarlyTermination),
                );
            } else {
                expect(updateEarlyTerminationSpy).not.toHaveBeenCalled();
            }
        },
    );

    it('does not terminate any version when the collection has no auditable version', async () => {
        const agreementCollectionId = new Types.ObjectId();
        const nonAuditableVersion = createAgreementVersion(1);
        const createdAgreementVersion = createAgreementVersion(2);
        const agreementCollection = {
            _id: agreementCollectionId,
            auditableVersionNumber: null,
            agreementVersions: [nonAuditableVersion],
        };

        vi.spyOn(
            agreementCollectionService,
            'getCleanAgreementCollectionByScope',
        ).mockResolvedValue(agreementCollection as never);
        vi.spyOn(scopeManagerIntegration, 'getOrganizationByName').mockResolvedValue({
            _id: new Types.ObjectId(),
        } as never);
        vi.spyOn(
            agreementTemplateService,
            'getCleanAgreementTemplateByOrganization',
        ).mockResolvedValue({ _id: createdAgreementVersion.contract.agreementTemplateId } as never);
        vi.spyOn(signatureService, 'createSignaturesByVersion').mockResolvedValue([
            { _id: createdAgreementVersion.contract.signaturesId[0] },
        ] as never);
        vi.spyOn(agreementVersionRepository, 'createAgreementVersion').mockResolvedValue({
            ...agreementCollection,
            agreementVersions: [nonAuditableVersion, createdAgreementVersion],
        } as never);
        const updateEarlyTerminationSpy = vi
            .spyOn(agreementVersionRepository, 'updateAgreementVersionEarlyTermination')
            .mockResolvedValue(null);

        await agreementVersionService.createAgreementVersionByCollection(
            'organization',
            'scope',
            'agreement',
            {
                contract: {
                    agreementTemplateName: 'agreement-template',
                    validity: createdAgreementVersion.contract.validity,
                },
                signatures: [],
            },
        );

        expect(updateEarlyTerminationSpy).not.toHaveBeenCalled();
    });
});

describe('delete agreement version by selector', () => {
    it.each([
        { selector: '1', expectedVersionNumber: 4, expectedAuditableReset: false },
        {
            selector: 'auditableVersion',
            expectedVersionNumber: 9,
            expectedAuditableReset: true,
        },
    ])(
        'resolves $selector before deleting its signatures and embedded version',
        async ({ selector, expectedVersionNumber, expectedAuditableReset }) => {
            const agreementCollectionId = new Types.ObjectId();
            const firstAgreementVersion = createAgreementVersion(4);
            const auditableAgreementVersion = createAgreementVersion(9);
            const agreementCollection = {
                _id: agreementCollectionId,
                auditableVersionNumber: 9,
                agreementVersions: [firstAgreementVersion, auditableAgreementVersion],
            };
            vi.spyOn(
                agreementCollectionService,
                'getCleanAgreementCollectionByScope',
            ).mockResolvedValue(agreementCollection as never);
            const deleteSignaturesSpy = vi
                .spyOn(signatureService, 'deleteSignaturesByIds')
                .mockResolvedValue({ acknowledged: true, deletedCount: 1 } as never);
            const deleteAgreementVersionSpy = vi
                .spyOn(agreementVersionRepository, 'deleteAgreementVersionByCollection')
                .mockResolvedValue(null);

            await agreementVersionService.deleteAgreementVersionBySelector(
                'organization',
                'scope',
                'agreement',
                selector,
            );

            const selectedAgreementVersion =
                expectedVersionNumber === 4 ? firstAgreementVersion : auditableAgreementVersion;
            expect(deleteSignaturesSpy).toHaveBeenCalledWith(
                selectedAgreementVersion.contract.signaturesId,
            );
            expect(deleteAgreementVersionSpy).toHaveBeenCalledWith(
                agreementCollectionId,
                expectedVersionNumber,
                expectedAuditableReset,
            );
        },
    );
});
