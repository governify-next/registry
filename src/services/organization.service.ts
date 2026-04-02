import * as organizationRepository from '../repositories/organization.repository.js';
import { IOrganization } from '../models/organization.model.js';
import type { FieldArrayName } from '../types/organization.types.js';
import type { ExpandMode } from '../types/membership.types.js';
import * as membershipService from '../services/membership.service.js';
import * as elementService from '../services/element.service.js';
import * as agreementTemplateService from '../services/agreementTemplate.service.js';
import { Types } from 'mongoose';
import { getUserByUsername } from './user.service.js';
import { DuplicateKeyError, NotFoundError } from '../utils/customErrors.js';

// Para trabajo interno en la organización
export const getOrganizationByName = async (orgName: string) => {
    return await organizationRepository.getOrganizationByName(orgName);
};

export const createOrganization = async (data: Partial<IOrganization>, userId: Types.ObjectId) => {
    const { name, displayName, description } = data;
    // Creamos la organización con el rol base
    const createdOrganization = await organizationRepository.createOrganization({
        name,
        displayName,
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

export const getOrganizationById = async (organizationId: string) => {
    return await organizationRepository.getOrganizationById(organizationId);
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    const { name, displayName, description } = data;
    return await organizationRepository.updateOrganization(orgName, {
        name,
        displayName,
        description,
    });
};

export const deleteOrganization = async (orgName: string) => {
    const organization = await getOrganizationByName(orgName);
    const orgId = organization!._id;
    // Borramos las memberships asociadas
    await membershipService.removeMembershipsByOrganization(orgId);
    // Borramos los agreement templates asociados
    const templates =
        await agreementTemplateService.getCleanAgreementTemplatesByOrganization(orgId);
    await Promise.all(
        templates.map((t) =>
            agreementTemplateService.deleteAgreementTemplateByOrganization(orgId, t.name),
        ),
    );
    // Borramos los elements asociados
    const elements = await elementService.getElementsByOrganization(orgId);
    await Promise.all(elements.map((e) => elementService.deleteElement(orgId, e.name)));
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

export const addRoleToUser = async (orgName: string, username: string, roleName: string) => {
    const user = await getUserByUsername(username);
    const organization = await getOrganizationByName(orgName);
    const role = organization?.roles.find((r) => r.name === roleName);

    const userHasRole = await membershipService.findEspecificRole(
        organization!._id,
        user!._id,
        role!._id!,
    );
    if (userHasRole) {
        throw new DuplicateKeyError('User already has that role in the organization');
    }

    return await membershipService.assignRole(user!._id, organization!._id, role!._id!);
};

export const getMembers = async (orgName: string, expand: ExpandMode) => {
    const organization = await getOrganizationByName(orgName);
    const memberships = await membershipService.getMembershipsByOrganization(
        organization!._id,
        expand,
    );

    // Sin expansión, devolvemos las memberships tal cual están guardadaas
    if (expand === 'none') return memberships;

    // Con expansión, reemplazamos rolesId por roles resueltos desde la organización
    return memberships.map((m) => ({
        ...m.toObject(), // convertimos el documento de mongoose a un objeto plano (solo datos) y copiamos sus propiedades en un objeto nuevo
        rolesId: undefined, // sobreescribimos los id de roles a undefined (los eliminamos)
        roles: m.rolesId.map((id) => {
            const role = organization!.roles.find((r) => r._id!.toString() === id.toString());
            return expand === 'full' ? role : { _id: role?._id, name: role?.name };
        }),
    }));
};

export const removeRoleFromUser = async (orgName: string, username: string, roleName: string) => {
    const user = await getUserByUsername(username);
    const organization = await getOrganizationByName(orgName);
    const role = organization?.roles.find((r) => r.name === roleName);

    const userHasRole = await membershipService.findEspecificRole(
        organization!._id,
        user!._id,
        role!._id!,
    );
    if (!userHasRole) {
        throw new NotFoundError('User does not have that role in the organization');
    }

    return await membershipService.unassignRole(organization!._id, user!._id, role!._id!);
};
