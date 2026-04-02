import { Types } from 'mongoose';
import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import { resolveElementId } from './element.service.js';
import { IAgreementCollection } from '../models/agreementCollection.model.js';
import { assembleAgreementVersions } from './agreementVersion.service.js';
import { deleteSignaturesByIds } from './signature.service.js';

export const getAgreementCollectionsByElement = async (
    orgName: string,
    elementName: string,
    expand: boolean,
) => {
    const element = await resolveElementId(orgName, elementName);

    const collections = await agreementCollectionRepository.getAgreementCollectionsByElement(
        element._id,
    );

    if (!expand) return collections;

    return await Promise.all(
        collections.map(async (col) => ({
            ...col.toObject(),
            agreementVersions: await assembleAgreementVersions(col.agreementVersions),
        })),
    );
};

export const getAgreementCollectionByElement = async (
    orgName: string,
    elementName: string,
    agColName: string,
    expand: boolean = false,
) => {
    const element = await resolveElementId(orgName, elementName);

    const collection = await agreementCollectionRepository.getAgreementCollectionByElement(
        element._id,
        agColName,
    );

    if (!expand) return collection;

    return {
        ...collection!.toObject(),
        agreementVersions: await assembleAgreementVersions(collection!.agreementVersions),
    };
};

export const getCleanAgreementCollectionByElement = async (
    orgName: string,
    elementName: string,
    agColName: string,
) => {
    const element = await resolveElementId(orgName, elementName);

    return await agreementCollectionRepository.getAgreementCollectionByElement(
        element._id,
        agColName,
    );
};

export const createAgreementCollectionByElement = async (
    orgName: string,
    elementName: string,
    data: Partial<IAgreementCollection>,
) => {
    // TODO: validar en middleware que no se puedan pasar x campos en post
    const element = await resolveElementId(orgName, elementName);

    // 3. Creamos el agreement collection
    return await agreementCollectionRepository.createAgreementCollectionByElement(
        data,
        element._id,
    );
};

export const updateAgreementCollectionByElement = async (
    orgName: string,
    elementName: string,
    agColName: string,
    data: Partial<IAgreementCollection>,
) => {
    const { name, displayName, auditableVersionNumber, fields, permissions } = data;

    // Obtenemos el agreementCollection
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agColName,
    );

    return await agreementCollectionRepository.updateAgreementCollectionByElement(
        agreementCollection!._id,
        { name, displayName, auditableVersionNumber, fields, permissions },
    );
};

export const getAgreementCollectionsByElementId = async (elementId: Types.ObjectId) => {
    return await agreementCollectionRepository.getAgreementCollectionsByElement(elementId);
};

export const deleteAgreementCollectionById = async (agColId: Types.ObjectId) => {
    // Obtenemos la collection para extraer los signatureIds de todas las versions
    const collection = await agreementCollectionRepository.getAgreementCollectionById(agColId);
    const signatureIds = collection!.agreementVersions.flatMap((v) => v.contract.signaturesId);
    if (signatureIds.length > 0) {
        await deleteSignaturesByIds(signatureIds);
    }
    return await agreementCollectionRepository.deleteAgreementCollectionByElement(agColId);
};

export const deleteAgreementCollectionByElement = async (
    orgName: string,
    elementName: string,
    agColName: string,
) => {
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agColName,
    );

    return await deleteAgreementCollectionById(agreementCollection!._id);
};
