import { Types } from 'mongoose';
import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';
import { IAgreementCollection } from '../models/agreementCollection.model.js';
import { assembleAgreementVersions } from './agreementVersion.service.js';
import { deleteSignaturesByIds } from './signature.service.js';

export const getAgreementCollectionsByScope = async (
    orgName: string,
    scopeName: string,
    expand: boolean,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndNameAndScopeName(
        orgName,
        scopeName,
    );

    const collections = await agreementCollectionRepository.getAgreementCollectionsByScope(
        scope._id,
    );

    if (!expand) return collections;

    return await Promise.all(
        collections.map(async (col) => ({
            ...col.toObject(),
            agreementVersions: await assembleAgreementVersions(col.agreementVersions),
        })),
    );
};

export const getAgreementCollectionByScope = async (
    orgName: string,
    scopeName: string,
    agColName: string,
    expand: boolean = false,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndNameAndScopeName(
        orgName,
        scopeName,
    );

    const collection = await agreementCollectionRepository.getAgreementCollectionByScope(
        scope._id,
        agColName,
    );

    if (!expand) return collection;

    return {
        ...collection!.toObject(),
        agreementVersions: await assembleAgreementVersions(collection!.agreementVersions),
    };
};

export const getCleanAgreementCollectionByScope = async (
    orgName: string,
    scopeName: string,
    agColName: string,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndNameAndScopeName(
        orgName,
        scopeName,
    );

    return await agreementCollectionRepository.getAgreementCollectionByScope(scope._id, agColName);
};

export const createAgreementCollectionByScope = async (
    orgName: string,
    scopeName: string,
    data: Partial<IAgreementCollection>,
) => {
    // TODO: validar en middleware que no se puedan pasar x campos en post
    const scope = await scopeManagerIntegration.getScopeByOrgAndNameAndScopeName(
        orgName,
        scopeName,
    );

    // 3. Creamos el agreement collection
    return await agreementCollectionRepository.createAgreementCollectionByScope(data, scope._id);
};

export const updateAgreementCollectionByScope = async (
    orgName: string,
    scopeName: string,
    agColName: string,
    data: Partial<IAgreementCollection>,
) => {
    const { name, displayName, auditableVersionNumber, fields, permissions } = data;

    // Obtenemos el agreementCollection
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeName,
        agColName,
    );

    return await agreementCollectionRepository.updateAgreementCollectionByScope(
        agreementCollection!._id,
        { name, displayName, auditableVersionNumber, fields, permissions },
    );
};

export const getAgreementCollectionsByScopeId = async (scopeId: Types.ObjectId) => {
    return await agreementCollectionRepository.getAgreementCollectionsByScope(scopeId);
};

export const deleteAgreementCollectionById = async (agColId: Types.ObjectId) => {
    // Obtenemos la collection para extraer los signatureIds de todas las versions
    const collection = await agreementCollectionRepository.getAgreementCollectionById(agColId);
    const signatureIds = collection!.agreementVersions.flatMap((v) => v.contract.signaturesId);
    if (signatureIds.length > 0) {
        await deleteSignaturesByIds(signatureIds);
    }
    return await agreementCollectionRepository.deleteAgreementCollectionByScope(agColId);
};

export const deleteAgreementCollectionByScope = async (
    orgName: string,
    scopeName: string,
    agColName: string,
) => {
    const agreementCollection = await getCleanAgreementCollectionByScope(
        orgName,
        scopeName,
        agColName,
    );

    return await deleteAgreementCollectionById(agreementCollection!._id);
};
