import Organization, { IOrganization } from '../models/organization.model.js';

import { DuplicateKeyError } from '../utils/customErrors.js';

export const createOrganization = async (data: Partial<IOrganization>) => {
    try {
        const organization = new Organization(data);
        return await organization.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { id?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.id) {
            throw new DuplicateKeyError(
                'An organization with that id already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getOrganizations = async () => {
    return await Organization.find();
};

export const getOrganizationById = async (orgId: string) => {
    return await Organization.findOne({ id: orgId }); // findById busca por _id, por eso siempre usamos findOne, porque usamos el id externo
};

export const updateOrganization = async (orgId: string, data: Partial<IOrganization>) => {
    try {
        return await Organization.findOneAndUpdate({ id: orgId }, data, { new: true }); // new: true devuelve el doc tras actualización
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { id?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.id) {
            throw new DuplicateKeyError(
                'An organization with that id already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteOrganization = async (orgId: string) => {
    return await Organization.findOneAndDelete({ id: orgId });
};
