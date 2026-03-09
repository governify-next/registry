import * as organizationRepository from '../repositories/organization.repository.js';
import { IOrganization } from '../models/organization.model.js';
import { NotFoundError } from '../utils/customErrors.js';

export const createOrganization = async (data: Partial<IOrganization>) => {
    return await organizationRepository.createOrganization(data);
};

export const getOrganizations = async () => {
    return await organizationRepository.getOrganizations();
};

export const getOrganizationById = async (orgId: string) => {
    const organization = await organizationRepository.getOrganizationById(orgId);
    if (!organization) throw new NotFoundError(`Organization with id '${orgId}' not found`);
    return organization;
};

export const updateOrganization = async (orgId: string, data: Partial<IOrganization>) => {
    const organization = await organizationRepository.updateOrganization(orgId, data);
    if (!organization) throw new NotFoundError(`Organization with id '${orgId}' not found`);
    return organization;
};

export const deleteOrganization = async (orgId: string) => {
    const organization = await organizationRepository.deleteOrganization(orgId);
    if (!organization) throw new NotFoundError(`Organization with id '${orgId}' not found`);
    return organization;
};
