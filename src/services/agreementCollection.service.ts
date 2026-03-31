import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import { resolveElementId } from './element.service.js';
import { IAgreementCollection } from '../models/agreementCollection.model.js';
import { assembleAgreementVersions } from './agreementVersion.service.js';

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

export const deleteAgreementCollectionByElement = async (
    orgName: string,
    elementName: string,
    agColName: string,
) => {
    // Obtenemos el agreementCollection
    const agreementCollection = await getCleanAgreementCollectionByElement(
        orgName,
        elementName,
        agColName,
    );

    // TODO: Borrar signatures relacionadas con las versions

    return await agreementCollectionRepository.deleteAgreementCollectionByElement(
        agreementCollection!._id,
    );
};
