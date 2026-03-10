import Element, { IElement } from '../models/element.model.js';
import { Types } from 'mongoose';
import { DuplicateKeyError } from '../utils/customErrors.js';

export const createElement = async (organizationId: Types.ObjectId, data: Partial<IElement>) => {
    try {
        const element = new Element({
            ...data,
            organizationId,
        });
        return await element.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number; organizationId?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name && e.keyPattern?.organizationId) {
            throw new DuplicateKeyError(
                'An element with that name already exists in this organization',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getElementsByOrganizationId = async (organizationId: Types.ObjectId) => {
    return await Element.find({ organizationId });
};

export const getElementByName = async (organizationId: Types.ObjectId, elementName: string) => {
    return await Element.findOne({ organizationId, name: elementName });
};

export const updateElement = async (
    organizationId: Types.ObjectId,
    elementName: string,
    data: Partial<IElement>,
) => {
    try {
        return await Element.findOneAndUpdate({ organizationId, name: elementName }, data, {
            new: true,
        });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number; organizationId?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name && e.keyPattern?.organizationId) {
            throw new DuplicateKeyError(
                'An element with that name already exists in this organization',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteElement = async (organizationId: Types.ObjectId, elementName: string) => {
    return await Element.findOneAndDelete({ organizationId, name: elementName });
};
