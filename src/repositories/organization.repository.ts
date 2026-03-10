import Organization, { IOrganization } from '../models/organization.model.js';
import { DuplicateKeyError } from '../utils/customErrors.js';

export const createOrganization = async (data: Partial<IOrganization>) => {
    try {
        const organization = new Organization(data);
        return await organization.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'An organization with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getOrganizations = async () => {
    return await Organization.find();
};

export const getOrganizationByName = async (orgName: string) => {
    return await Organization.findOne({ name: orgName });
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    try {
        return await Organization.findOneAndUpdate({ name: orgName }, data, { new: true });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'An organization with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteOrganization = async (orgName: string) => {
    return await Organization.findOneAndDelete({ name: orgName });
};

export const addRole = async (orgName: string, role: { name: string; description: string }) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $push: { roles: role } },
        { new: true },
    );
};
