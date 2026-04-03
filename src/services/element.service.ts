import * as elementRepository from '../repositories/element.repository.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
import * as organizationService from './organization.service.js';
import { IElement } from '../models/element.model.js';
import { NotFoundError } from '../utils/customErrors.js';
import { getOrganizationByName } from './organization.service.js';
import { Types } from 'mongoose';

// Helper para obtener un elemento
export const resolveElementId = async (orgName: string, elementName: string) => {
    // 1. Obtenemos la organización
    const organization = await getOrganizationByName(orgName);

    // 2. Obtenemos el elemento
    return await getElementByName(organization!._id, elementName);
};

export const createElement = async (organizationId: Types.ObjectId, data: Partial<IElement>) => {
    return await elementRepository.createElement(organizationId, data);
};

export const getElementsByOrganization = async (organizationId: Types.ObjectId) => {
    return await elementRepository.getElementsByOrganizationId(organizationId);
};

export const getElementByName = async (organizationId: Types.ObjectId, elementName: string) => {
    const element = await elementRepository.getElementByName(organizationId, elementName);
    if (!element) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    return element;
};

export const updateElement = async (
    organizationId: Types.ObjectId,
    elementName: string,
    data: Partial<IElement>,
) => {
    const element = await elementRepository.updateElement(organizationId, elementName, data);
    if (!element) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    return element;
};

export const deleteElement = async (organizationId: Types.ObjectId, elementName: string) => {
    const element = await elementRepository.getElementByName(organizationId, elementName);
    if (!element) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    // Borramos las agreement collections asociadas al elemento
    const collections = await agreementCollectionService.getAgreementCollectionsByElementId(
        element._id,
    );
    await Promise.all(
        collections.map((col) => agreementCollectionService.deleteAgreementCollectionById(col._id)),
    );

    return await elementRepository.deleteElement(organizationId, elementName);
};

export const getElementParts = async (organizationId: Types.ObjectId, elementName: string) => {
    const element = await getElementByName(organizationId, elementName);
    if (!element) {
        return null;
    }

    return element.parts;
};

export const addElementPart = async (
    organizationId: Types.ObjectId,
    elementName: string,
    data: { auditConfig: Record<string, unknown> },
) => {
    const part = await elementRepository.addElementPart(organizationId, elementName, data);
    if (!part) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    return part;
};

export const getElementPartById = async (
    organizationId: Types.ObjectId,
    elementName: string,
    partId: string,
) => {
    await getElementByName(organizationId, elementName);

    const part = await elementRepository.getElementPartById(organizationId, elementName, partId);
    if (!part) {
        throw new NotFoundError(
            `Element part with id '${partId}' not found in element '${elementName}'`,
        );
    }

    return part;
};

export const updateElementPart = async (
    organizationId: Types.ObjectId,
    elementName: string,
    partId: string,
    data: { auditConfig: Record<string, unknown> },
) => {
    await getElementByName(organizationId, elementName);

    const part = await elementRepository.updateElementPart(
        organizationId,
        elementName,
        partId,
        data,
    );
    if (!part) {
        throw new NotFoundError(
            `Element part with id '${partId}' not found in element '${elementName}'`,
        );
    }

    return part;
};

export const deleteElementPart = async (
    organizationId: Types.ObjectId,
    elementName: string,
    partId: string,
) => {
    await getElementByName(organizationId, elementName);

    const deleted = await elementRepository.deleteElementPart(organizationId, elementName, partId);
    if (!deleted) {
        throw new NotFoundError(
            `Element part with id '${partId}' not found in element '${elementName}'`,
        );
    }

    return deleted;
};

export const addRoleToElementPermission = async (
    organizationId: Types.ObjectId,
    elementName: string,
    permissionName: string,
    roleNames: string[],
) => {
    const element = await getElementByName(organizationId, elementName);
    if (!element) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    const organization = await organizationService.getOrganizationById(organizationId.toString());

    const roleIds = roleNames.map((roleName) => {
        const role = organization!.roles.find((r) => r.name === roleName);
        if (!role) {
            throw new NotFoundError(`Role '${roleName}' not found in organization`);
        }
        return role._id!;
    });

    if (!['view', 'edit', 'delete', 'create'].includes(permissionName)) {
        throw new NotFoundError(`Permission '${permissionName}' not found on element`);
    }

    return await elementRepository.addRoleToElementPermission(
        organizationId,
        elementName,
        permissionName,
        roleIds,
    );
};
