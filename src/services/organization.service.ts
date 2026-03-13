import * as organizationRepository from '../repositories/organization.repository.js';
import { IOrganization } from '../models/organization.model.js';
import { NotFoundError, DuplicateKeyError } from '../utils/customErrors.js';
import type { FieldArrayName } from '../repositories/organization.repository.js';
import * as membershipService from '../services/membership.service.js';

// Para trabajar en módulos como elementos
export const getOrganizationIdByName = async (orgName: string) => {
    const organizationId = await organizationRepository.getOrganizationIdByName(orgName);
    if (!organizationId) throw new NotFoundError(`Organization with name '${orgName}' not found`);
    return organizationId;
};

// Para trabajo interno en la organización
export const getOrganizationByName = async (orgName: string) => {
    const organization = await organizationRepository.getOrganizationByName(orgName);
    if (!organization) throw new NotFoundError(`Organization with name '${orgName}' not found`);
    return organization;
};

export const createOrganization = async (data: Partial<IOrganization>) => {
    const { name, description } = data;
    return await organizationRepository.createOrganization({ name, description });
};

export const getOrganizations = async () => {
    return await organizationRepository.getOrganizations();
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    const { name, description } = data;
    const organization = await organizationRepository.updateOrganization(orgName, {
        name,
        description,
    });
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

export const updateRole = async (
    orgName: string,
    roleName: string,
    data: { name: string; description: string },
) => {
    const org = await getOrganizationByName(orgName);
    if (!org.roles.some((r) => r.name === roleName))
        throw new NotFoundError(`Role '${roleName}' not found in organization '${orgName}'`);
    // Si hay nombre nuevo aseguramos que no coincida con otro creado en la organización
    if (data.name !== roleName && org.roles.some((r) => r.name === data.name))
        throw new DuplicateKeyError(
            `Role '${data.name}' already exists in organization '${orgName}'`,
            {},
        );
    return await organizationRepository.updateRole(orgName, roleName, data);
};

export const deleteRole = async (orgName: string, roleName: string) => {
    const org = await getOrganizationByName(orgName);
    // Como obtenemos la org, pasamos ya el id del rol para el borrado en Membership
    const roleToDelete = org.roles.find((r) => r.name === roleName);
    if (!roleToDelete)
        throw new NotFoundError(`Role '${roleName}' not found in organization '${orgName}'`);
    // Llamamos a Membership para que borre el rol de las asignaciones
    await membershipService.removeRoleFromMemberships(roleToDelete._id.toString());
    // TODO: llamar al service de Membership para borrar la asignación antes de borrar rol de Org con roleToDelete._id.toString()
    return await organizationRepository.deleteRole(orgName, roleName);
};

export const addField = async (
    arrayName: FieldArrayName,
    orgName: string,
    field: { name: string; description: string; type: string; value?: unknown },
) => {
    const org = await getOrganizationByName(orgName);
    if (org[arrayName].some((f) => f.name === field.name))
        throw new DuplicateKeyError(
            `${arrayName} '${field.name}' already exists in organization '${orgName}'`,
            {},
        );
    return await organizationRepository.addField(orgName, arrayName, field);
};

export const updateField = async (
    arrayName: FieldArrayName,
    orgName: string,
    fieldName: string,
    data: { name: string; description: string; type: string; value?: unknown },
) => {
    const org = await getOrganizationByName(orgName);
    if (!org[arrayName].some((f) => f.name === fieldName))
        throw new NotFoundError(
            `${arrayName} '${fieldName}' not found in organization '${orgName}'`,
        );
    if (data.name !== fieldName && org[arrayName].some((f) => f.name === data.name))
        throw new DuplicateKeyError(
            `${arrayName} '${data.name}' already exists in organization '${orgName}'`,
            {},
        );
    return await organizationRepository.updateField(orgName, arrayName, fieldName, data);
};

export const deleteField = async (
    arrayName: FieldArrayName,
    orgName: string,
    fieldName: string,
) => {
    const org = await getOrganizationByName(orgName);
    if (!org[arrayName].some((f) => f.name === fieldName))
        throw new NotFoundError(
            `${arrayName} '${fieldName}' not found in organization '${orgName}'`,
        );
    return await organizationRepository.deleteField(orgName, arrayName, fieldName);
};
