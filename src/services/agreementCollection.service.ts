import { Types } from 'mongoose';
import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';
import * as directorIntegration from '../integrations/director.integration.js';
import { IAgreementCollection } from '../models/agreementCollection.model.js';
import { assembleAgreementVersions } from './agreementVersion.service.js';
import { deleteSignaturesByIds } from './signature.service.js';

const getAutoTrackedAgreementVersions = async (orgName: string) => {
    const stateTasks = await Promise.all(
        (['generateConsolidatedStates', 'generateEvolutiveStates'] as const).map((script) =>
            directorIntegration.getTasksByFilters({
                script,
                enabled: true,
                inputArgs: { orgName },
            }),
        ),
    );

    return new Set(
        stateTasks
            .flat()
            .map(
                (task: {
                    inputArgs: Pick<
                        directorIntegration.IRecurringStateTaskInputArgs,
                        'agColId' | 'agreementVersion'
                    >;
                }) => `${task.inputArgs.agColId}:${task.inputArgs.agreementVersion}`,
            ),
    );
};

export const getAgreementCollectionsByOrganization = async (orgName: string) => {
    const scopeIds = await scopeManagerIntegration.getScopeIdsByOrganization(orgName);

    const [collections, trackedVersions] = await Promise.all([
        agreementCollectionRepository.getAgreementCollectionsByScopeIds(scopeIds),
        getAutoTrackedAgreementVersions(orgName),
    ]);

    return collections.map((col) => ({
        ...col.toObject(),
        autoTracking:
            col.auditableVersionNumber !== null &&
            trackedVersions.has(
                `${col._id}:${col.agreementVersions.findIndex((v) => v.versionNumber === col.auditableVersionNumber) + 1}`,
            ),
    }));
};

export const countAgreementCollectionsByScopeIds = async (scopeIds: string[]) => {
    return await agreementCollectionRepository.countAgreementCollectionsByScopeIds(scopeIds);
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

export const getAgreementCollectionByScopeAndName = async (
    orgName: string,
    scopeId: string,
    agColName: string,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId);

    return await agreementCollectionRepository.getAgreementCollectionByScopeAndName(
        scope._id,
        agColName,
    );
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
    return await agreementCollectionRepository.getAgreementCollectionByScopeAndName(
        scopeId,
        agColName,
    );
};

export const getAgreementCollectionPermissionsById = async (agColId: string) => {
    const collection =
        await agreementCollectionRepository.getAgreementCollectionPermissionsById(agColId);
    return collection!.permissions;
};

export const updateAgreementCollectionPermissionsById = async (
    agColId: string,
    permissions: IAgreementCollection['permissions'],
) => {
    const collection = await agreementCollectionRepository.updateAgreementCollectionPermissionsById(
        agColId,
        permissions,
    );
    return collection!.permissions;
};

export const createAgreementCollectionByScope = async (
    orgName: string,
    scopeId: string,
    data: Partial<IAgreementCollection>,
) => {
    const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId);

    const collection = await agreementCollectionRepository.createAgreementCollectionByScope(
        data,
        scope._id,
    );
    return await agreementCollectionRepository.getAgreementCollectionById(
        collection._id.toString(),
    );
};

export const updateAgreementCollectionById = async (
    agColId: string,
    data: Partial<IAgreementCollection>,
) => {
    return await agreementCollectionRepository.updateAgreementCollectionByScope(agColId, data);
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
