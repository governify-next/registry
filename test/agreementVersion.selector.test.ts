import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { resolveAgreementVersionSelector } from '../src/services/agreementVersion.service.js';

const createAgreementVersion = (versionNumber: number) => ({
    versionNumber,
    contract: {
        agreementTemplateId: new Types.ObjectId(),
        validity: {
            timezone: 'Europe/Madrid',
            initial: new Date('2026-01-01T00:00:00.000Z'),
            end: new Date('2026-12-31T23:59:59.999Z'),
            earlyTermination: null,
        },
        signaturesId: [],
    },
});

describe('agreement version selector', () => {
    it('maps a one-based numeric selector to the zero-based array index', () => {
        const firstAgreementVersion = createAgreementVersion(4);
        const secondAgreementVersion = createAgreementVersion(9);
        const collection = {
            agreementVersions: [firstAgreementVersion, secondAgreementVersion],
            auditableVersionNumber: 9,
        } as never;

        expect(resolveAgreementVersionSelector(collection, '1')).toBe(firstAgreementVersion);
        expect(resolveAgreementVersionSelector(collection, '2')).toBe(secondAgreementVersion);
    });

    it('resolves auditableVersion through auditableVersionNumber', () => {
        const firstAgreementVersion = createAgreementVersion(4);
        const auditableAgreementVersion = createAgreementVersion(9);
        const collection = {
            agreementVersions: [firstAgreementVersion, auditableAgreementVersion],
            auditableVersionNumber: 9,
        } as never;

        expect(resolveAgreementVersionSelector(collection, 'auditableVersion')).toBe(
            auditableAgreementVersion,
        );
    });

    it('distinguishes invalid selectors from missing agreement versions', () => {
        const collection = {
            agreementVersions: [createAgreementVersion(4)],
            auditableVersionNumber: null,
        } as never;

        expect(() => resolveAgreementVersionSelector(collection, 'version-1')).toThrowError(
            expect.objectContaining({ httpStatus: 400 }),
        );
        expect(() => resolveAgreementVersionSelector(collection, '0')).toThrowError(
            expect.objectContaining({ httpStatus: 400 }),
        );
        expect(() => resolveAgreementVersionSelector(collection, '2')).toThrowError(
            expect.objectContaining({ httpStatus: 404 }),
        );
        expect(() => resolveAgreementVersionSelector(collection, 'auditableVersion')).toThrowError(
            expect.objectContaining({ httpStatus: 404 }),
        );
    });
});
