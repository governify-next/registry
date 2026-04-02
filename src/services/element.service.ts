import * as elementRepository from '../repositories/element.repository.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
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
