import * as elementRepository from '../repositories/element.repository.js';
import { IElement } from '../models/element.model.js';
import { NotFoundError } from '../utils/customErrors.js';
import { Types } from 'mongoose';

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
    const deletedElement = await elementRepository.deleteElement(organizationId, elementName);
    if (!deletedElement) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    return deletedElement;
};
