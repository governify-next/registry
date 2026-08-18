import { IAgreementCollection, IAgreementVersion } from '../models/agreementCollection.model.js';
import * as agreementVersionRepository from '../repositories/agreementVersion.repository.js';
import { IAgreementVersionPayload } from '../types/agreementVersion.types.js';
import { getCleanAgreementCollectionByScope } from './agreementCollection.service.js';
import { getCleanAgreementTemplateByOrganization } from './agreementTemplate.service.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';
import {
    assembleBySignature,
    createSignaturesByVersion,
    deleteSignaturesByIds,
} from './signature.service.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

export const resolveAgreementVersionSelector = (
    agreementCollection: Pick<IAgreementCollection, 'agreementVersions' | 'auditableVersionNumber'>,
    agreementVersion: string,
): IAgreementVersion => {
    if (agreementVersion === 'auditableVersion') {
        if (agreementCollection.auditableVersionNumber === null) {
            throw new NotFoundError('No auditable version in this collection');
        }

        const auditableVersion = agreementCollection.agreementVersions.find(
            (agreementVersion) =>
                agreementVersion.versionNumber === agreementCollection.auditableVersionNumber,
        );
        if (!auditableVersion) {
            throw new NotFoundError('Auditable version not found in this collection');
        }
        return auditableVersion;
    }

    if (!/^[1-9]\d*$/.test(agreementVersion)) {
        throw new ValidationError(
            'agreementVersion must be "auditableVersion" or a one-based positive integer',
        );
    }

    const agreementVersionNumber = Number(agreementVersion);
    if (!Number.isSafeInteger(agreementVersionNumber)) {
        throw new ValidationError('agreementVersion number exceeds the supported integer range');
    }

    const agreementVersionIndex = agreementVersionNumber - 1;
    const selectedAgreementVersion = agreementCollection.agreementVersions[agreementVersionIndex];
    if (!selectedAgreementVersion) {
        throw new NotFoundError(
            `Agreement version ${agreementVersionNumber} not found in this collection`,
        );
    }
    return selectedAgreementVersion;
};

export const getAgreementVersionBySelector = async (
    orgName: string,
    scopeId: string,
    agreementName: string,
    agreementVersion: string,
    expand: boolean,
) => {
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeId,
        agreementName,
    );
    const selectedAgreementVersion = resolveAgreementVersionSelector(
        agreementCollection!,
        agreementVersion,
    );

    if (!expand) return selectedAgreementVersion;
    return await assembleBySignature(selectedAgreementVersion);
};

export const createAgreementVersionByCollection = async (
    orgName: string,
    scopeId: string,
    agreementName: string,
    data: IAgreementVersionPayload,
) => {
    // TODO: validate in middleware that cannot pass a signaturesId or versionNumber. EarlyTermination could also be removed for the post

    const { signatures, ...versionData } = data;

    // 1. Get the agreement collection
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeId,
        agreementName,
    );

    // 2. Get the new version number, the highest one plus one, or 1 if there are no versions
    const versionNumbers = agreementCollection!.agreementVersions.map((v) => v.versionNumber);
    const newVersionNumber = Math.max(0, ...versionNumbers) + 1;

    // 3. Get the agreement template id
    const organization = await scopeManagerIntegration.getOrganizationByName(orgName);
    const agreementTemplate = await getCleanAgreementTemplateByOrganization(
        organization!._id,
        versionData.contract.agreementTemplateName,
    );
    const agreementTemplateId = agreementTemplate!._id;

    // 4. Create the signatures
    const newSignatures = await createSignaturesByVersion(signatures, agreementTemplateId);
    const signaturesId = newSignatures.map((s) => s._id);

    // 5. Build and create the agreementVersion
    const agreementVersion = {
        versionNumber: newVersionNumber,
        contract: {
            agreementTemplateId: agreementTemplateId,
            validity: versionData.contract.validity,
            signaturesId,
        },
    };

    const updatedCollection = await agreementVersionRepository.createAgreementVersion(
        agreementCollection!._id,
        agreementVersion,
    );

    const createdVersion = updatedCollection!.agreementVersions.find(
        (v) => v.versionNumber === newVersionNumber,
    );

    return createdVersion;
};

export const getAgreementVersionsByCollection = async (
    orgName: string,
    scopeId: string,
    agreementName: string,
    expand: boolean,
) => {
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeId,
        agreementName,
    );

    if (!expand) return agreementCollection!.agreementVersions;

    return await assembleAgreementVersions(agreementCollection!.agreementVersions);
};

export const getAuditableVersionByCollection = async (
    orgName: string,
    scopeId: string,
    agreementName: string,
    expand: boolean,
) => {
    // TODO: Validate in middleware that the collection that is called for the auditable version is not null and possibly that is valid
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeId,
        agreementName,
    );

    const agreementVersion = agreementCollection!.agreementVersions.find(
        (v) => v.versionNumber === agreementCollection!.auditableVersionNumber,
    );

    if (!expand) return agreementVersion;

    return await assembleBySignature(agreementVersion!);
};

export const deleteVersionByCollection = async (
    orgName: string,
    scopeId: string,
    agreementName: string,
    versionNumber: number,
) => {
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeId,
        agreementName,
    );

    const version = agreementCollection!.agreementVersions.find(
        (v) => v.versionNumber === versionNumber,
    );

    const signatureIds = version!.contract.signaturesId;

    await deleteSignaturesByIds(signatureIds);

    const isAuditable = agreementCollection!.auditableVersionNumber === versionNumber;

    return await agreementVersionRepository.deleteVersionByCollection(
        agreementCollection!._id,
        versionNumber,
        isAuditable,
    );
};

export const terminateActiveVersion = async (
    orgName: string,
    scopeId: string,
    agreementName: string,
    earlyTermination: string,
) => {
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeId,
        agreementName,
    );

    const version = agreementCollection!.agreementVersions.find(
        (v) => v.versionNumber === agreementCollection!.auditableVersionNumber,
    );

    return await agreementVersionRepository.terminateActiveVersion(
        agreementCollection!._id,
        version!.versionNumber,
        new Date(earlyTermination),
    );
};

export const assembleAgreementVersions = async (agreementVersions: IAgreementVersion[]) => {
    return await Promise.all(agreementVersions.map((v) => assembleBySignature(v)));
};
