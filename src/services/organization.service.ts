import * as organizationRepository from '../repositories/organization.repository.js';
import { IOrganization } from '../models/organization.model.js';
import type { FieldArrayName } from '../repositories/organization.repository.js';
import * as membershipService from '../services/membership.service.js';
import { Types } from 'mongoose';
import { getUserByUsername } from './user.service.js';

// Para trabajo interno en la organización
export const getOrganizationByName = async (orgName: string) => {
    return await organizationRepository.getOrganizationByName(orgName);
};

export const createOrganization = async (data: Partial<IOrganization>, userId: Types.ObjectId) => {
    const { name, description } = data;
    // Creamos la organización con el rol base
    const createdOrganization = await organizationRepository.createOrganization({
        name,
        description,
        roles: [{ name: 'admin', description: 'Organization Administrator' }],
    });
    // Obtenemos el id del rol admin generado por mongoose
    const adminRole = createdOrganization.roles.find((r) => r.name === 'admin')!;
    // Asignamos el rol admin al creador de la organización
    await membershipService.assignRole(userId, createdOrganization._id, adminRole._id!);
    // Devolvemos la organización creada
    return createdOrganization;
};

export const getOrganizations = async () => {
    return await organizationRepository.getOrganizations();
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    const { name, description } = data;
    return await organizationRepository.updateOrganization(orgName, {
        name,
        description,
    });
};

export const deleteOrganization = async (orgName: string) => {
    const organization = await getOrganizationByName(orgName);
    // Borramos las memberships asociadas
    await membershipService.removeMembershipsByOrganization(organization!._id);
    // Borramos la organización
    return await organizationRepository.deleteOrganization(orgName);
};

export const addRole = async (orgName: string, role: { name: string; description: string }) => {
    return await organizationRepository.addRole(orgName, role);
};

export const updateRole = async (
    orgName: string,
    roleName: string,
    data: { name: string; description: string },
) => {
    return await organizationRepository.updateRole(orgName, roleName, data);
};

export const deleteRole = async (orgName: string, roleName: string) => {
    const org = await getOrganizationByName(orgName);
    // Como obtenemos la org, pasamos ya el id del rol para el borrado en Membership
    const roleToDelete = org!.roles.find((r) => r.name === roleName);
    // Llamamos a Membership para que borre el rol de las asignaciones
    await membershipService.removeRoleFromMemberships(roleToDelete!._id!); // ! garantiza a Ts no nulo ahora que tenemos id? en interfaz
    // Borramos el rol de la organización
    return await organizationRepository.deleteRole(orgName, roleName);
};

export const addField = async (
    arrayName: FieldArrayName,
    orgName: string,
    field: { name: string; description: string; type: string; value?: unknown },
) => {
    return await organizationRepository.addField(orgName, arrayName, field);
};

export const updateField = async (
    arrayName: FieldArrayName,
    orgName: string,
    fieldName: string,
    data: { name: string; description: string; type: string; value?: unknown },
) => {
    return await organizationRepository.updateField(orgName, arrayName, fieldName, data);
};

export const deleteField = async (
    arrayName: FieldArrayName,
    orgName: string,
    fieldName: string,
) => {
    return await organizationRepository.deleteField(orgName, arrayName, fieldName);
};

export const addUserToOrganization = async (orgName: string, username: string) => {
    // Obtenemos id de usuario
    const user = await getUserByUsername(username);
    const userId = user!._id;
    // Obtenemos id de la organización
    const organization = await getOrganizationByName(orgName);
    const organizationId = organization!._id;
    // Creamos la membership
    return await membershipService.createMembership(organizationId, userId);
};

export const removeUserFromOrganization = async (orgName: string, username: string) => {
    const organization = await getOrganizationByName(orgName);
    const user = await getUserByUsername(username);
    const organizationId = organization!._id;
    const userId = user!._id;
    return await membershipService.removeMembership(organizationId, userId);
};
