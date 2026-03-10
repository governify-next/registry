import * as organizationRepository from '../repositories/organization.repository.js';
import { IOrganization } from '../models/organization.model.js';
import { NotFoundError, DuplicateKeyError } from '../utils/customErrors.js';

export const createOrganization = async (data: Partial<IOrganization>) => {
    return await organizationRepository.createOrganization(data);
};

export const getOrganizations = async () => {
    return await organizationRepository.getOrganizations();
};

export const getOrganizationByName = async (orgName: string) => {
    const organization = await organizationRepository.getOrganizationByName(orgName);
    if (!organization) throw new NotFoundError(`Organization with name '${orgName}' not found`);
    return organization;
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    const organization = await organizationRepository.updateOrganization(orgName, data);
    if (!organization) throw new NotFoundError(`Organization with name '${orgName}' not found`);
    return organization;
};

export const deleteOrganization = async (orgName: string) => {
    const organization = await organizationRepository.deleteOrganization(orgName);
    if (!organization) throw new NotFoundError(`Organization with name '${orgName}' not found`);
    return organization;
};

export const addRole = async (orgName: string, role: { name: string; description: string }) => {
    const org = await getOrganizationByName(orgName);
    if (org.roles.some((r) => r.name === role.name)) {
        throw new DuplicateKeyError(
            `Role '${role.name}' already exists in organization '${orgName}'`,
            {},
        );
    }
    return await organizationRepository.addRole(orgName, role);
};
