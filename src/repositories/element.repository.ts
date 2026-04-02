import Element, { IElement } from '../models/element.model.js';
import { Types } from 'mongoose';
import { DuplicateKeyError, NotFoundError } from '../utils/customErrors.js';

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

export const addElementPart = async (
    organizationId: Types.ObjectId,
    elementName: string,
    data: { auditConfig: Record<string, unknown> },
) => {
    return await Element.findOneAndUpdate(
        { organizationId, name: elementName },
        { $push: { parts: { auditConfig: data.auditConfig } } },
        { new: true },
    );
};

export const getElementPartById = async (
    organizationId: Types.ObjectId,
    elementName: string,
    partId: string,
) => {
    const element = await Element.findOne(
        {
            organizationId,
            name: elementName,
            'parts._id': partId,
        },
        { 'parts.$': 1 },
    );

    return element?.parts?.[0] ?? null;
};

export const updateElementPart = async (
    organizationId: Types.ObjectId,
    elementName: string,
    partId: string,
    data: { auditConfig: Record<string, unknown> },
) => {
    const result = await Element.updateOne(
        {
            organizationId,
            name: elementName,
            'parts._id': partId,
        },
        {
            $set: { 'parts.$.auditConfig': data.auditConfig },
        },
    );

    if (result.matchedCount === 0) {
        return null;
    }

    return await getElementPartById(organizationId, elementName, partId);
};

export const deleteElementPart = async (
    organizationId: Types.ObjectId,
    elementName: string,
    partId: string,
) => {
    return await Element.findOneAndUpdate(
        {
            organizationId,
            name: elementName,
            'parts._id': partId,
        },
        {
            $pull: { parts: { _id: partId } },
        },
        { new: true },
    );
};

export const addRoleToElementPermission = async (
    organizationId: Types.ObjectId,
    elementName: string,
    permissionName: string,
    roleIds: Types.ObjectId[],
) => {
    const element = await Element.findOne({ organizationId, name: elementName });
    if (!element) {
        throw new NotFoundError(`Element with name '${elementName}' not found in organization`);
    }

    const permission = element.permissions[permissionName as keyof typeof element.permissions]; // this was checked before
    if (!permission) {
        throw new NotFoundError(`Permission '${permissionName}' not found on element`);
    }

    for (const roleId of roleIds) {
        if (!permission.includes(roleId)) {
            permission.push(roleId);
        }
    }

    await element.save();
    return element;
};
