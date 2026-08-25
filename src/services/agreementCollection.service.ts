import { Types } from 'mongoose';
import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';
import { IAgreementCollection } from '../models/agreementCollection.model.js';
import { assembleAgreementVersions } from './agreementVersion.service.js';
import { deleteSignaturesByIds } from './signature.service.js';

export const getAgreementCollectionsByOrganization = async (orgName: string) => {
    const scopeIds = await scopeManagerIntegration.getScopeIdsByOrganization(orgName);

    return await agreementCollectionRepository.getAgreementCollectionsByScopeIds(scopeIds);
};

export const getAgreementCollectionsByScope = async (
    orgName: string,
    scopeId: string,
    expand: boolean,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId);

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

export const getCleanAgreementCollectionByScope = async (
    orgName: string,
    scopeId: string,
    agColId: string,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId);

    return await agreementCollectionRepository.getAgreementCollectionByScope(scope._id, agColId);
};

export const getAgreementCollectionById = async (agColId: string, expand: boolean = false) => {
    const collection = await agreementCollectionRepository.getAgreementCollectionById(agColId);

    if (!expand) return collection;

    return {
        ...collection!.toObject(),
        agreementVersions: await assembleAgreementVersions(collection!.agreementVersions),
    };
};

export const getAgreementCollectionByScopeIdAndName = async (
    scopeId: Types.ObjectId,
    agColName: string,
) => {
    return await agreementCollectionRepository.getAgreementCollectionByScope(scopeId, agColName);
};

export const createAgreementCollectionByScope = async (
    orgName: string,
    scopeId: string,
    data: Partial<IAgreementCollection>,
) => {
    // TODO: validate in middleware that cannot pass x fields in post
    const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId);

    // 3. Create the agreement collection
    return await agreementCollectionRepository.createAgreementCollectionByScope(data, scope._id);
};

export const updateAgreementCollectionById = async (
    agColId: string,
    data: Partial<IAgreementCollection>,
) => {
    const { name, displayName, description, auditableVersionNumber, fields, permissions } = data;

    return await agreementCollectionRepository.updateAgreementCollectionByScope(agColId, {
        name,
        displayName,
        description,
        auditableVersionNumber,
        fields,
        permissions,
    });
};

export const getAgreementCollectionsByScopeId = async (scopeId: Types.ObjectId) => {
    return await agreementCollectionRepository.getAgreementCollectionsByScope(scopeId);
};

export const deleteAgreementCollectionById = async (agColId: string) => {
    // Get the collection to extract the signatureIds of all versions
    const collection = await agreementCollectionRepository.getAgreementCollectionById(agColId);
    const signatureIds = collection!.agreementVersions.flatMap((v) => v.contract.signaturesId);
    if (signatureIds.length > 0) {
        await deleteSignaturesByIds(signatureIds);
    }
    return await agreementCollectionRepository.deleteAgreementCollectionByScope(agColId);
};
