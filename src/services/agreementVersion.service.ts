import { IAgreementVersion } from '../models/agreementCollection.model.js';
import * as agreementVersionRepository from '../repositories/agreementVersion.repository.js';
import { AgreementVersionPayload } from '../types/agreementVersion.types.js';
import {
    getAgreementCollectionByElement,
    getCleanAgreementCollectionByElement,
} from './agreementCollection.service.js';
import { getCleanAgreementTemplateByOrganization } from './agreementTemplate.service.js';
import { getOrganizationByName } from './organization.service.js';
import {
    assembleBySignature,
    createSignaturesByVersion,
    deleteSignaturesByIds,
} from './signature.service.js';

export const createAgreementVersionByCollection = async (
    orgName: string,
    elementName: string,
    agreementName: string,
    data: AgreementVersionPayload,
) => {
    // TODO: validar en middleware que no se pase un signaturesId ni versionNumber. EarlyTermination también se podría quitar para el post

    const { signatures, ...versionData } = data;

    // 1. Obtenemos el AgreementCollection
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agreementName,
    );

    // 2. Obtenemos el nuevo version number
    const newVersionNumber = agreementCollection!.agreementVersions.length + 1;

    // 3. Obtenemos el id del template
    const organization = await getOrganizationByName(orgName);
    const agreementTemplate = await getCleanAgreementTemplateByOrganization(
        organization!._id,
        versionData.contract.agreementTemplateName,
    );
    const agreementTemplateId = agreementTemplate!._id;

    // 4. Creamos las signatures
    const newSignatures = await createSignaturesByVersion(signatures, agreementTemplateId);
    const signaturesId = newSignatures.map((s) => s._id);

    // 5. Construimos y creamos el AgreementVersion
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

    return updatedCollection;
};

export const getAgreementVersionsByCollection = async (
    orgName: string,
    elementName: string,
    agreementName: string,
    expand: boolean,
) => {
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agreementName,
    );

    if (!expand) return agreementCollection!.agreementVersions;

    return await assembleAgreementVersions(agreementCollection!.agreementVersions);
};

export const getAuditableVersionByCollection = async (
    orgName: string,
    elementName: string,
    agreementName: string,
    expand: boolean,
) => {
    // TODO: Validar en el middleware que el collection que se llama para el auditable version no la tenga en null y posiblemente que sea válida
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agreementName,
    );

    const agreementVersion = agreementCollection!.agreementVersions.find(
        (v) => v.versionNumber === agreementCollection!.auditableVersionNumber,
    );

    if (!expand) return agreementVersion;

    return await assembleBySignature(agreementVersion!);
};

export const deleteAuditableVersionByCollection = async (
    orgName: string,
    elementName: string,
    agreementName: string,
    versionNumber: number,
) => {
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agreementName,
    );

    const version = agreementCollection!.agreementVersions.find(
        (v) => v.versionNumber === versionNumber,
    );
    const signatureIds = version!.contract.signaturesId;

    await deleteSignaturesByIds(signatureIds);

    return await agreementVersionRepository.deleteAuditableVersionByCollection(
        agreementCollection!._id,
        versionNumber,
    );
};

export const terminateActiveVersion = async (
    orgName: string,
    elementName: string,
    agreementName: string,
) => {
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agreementName,
    );

    const version = agreementCollection!.agreementVersions.find(
        (v) => v.versionNumber === agreementCollection!.auditableVersionNumber,
    );

    return await agreementVersionRepository.terminateActiveVersion(
        agreementCollection!._id,
        version!.versionNumber,
    );
};

export const assembleAgreementVersions = async (agreementVersions: IAgreementVersion[]) => {
    return await Promise.all(agreementVersions.map((v) => assembleBySignature(v)));
};
