import { Types } from 'mongoose';
import * as membershipRepository from '../repositories/membership.repository.js';

export const removeRoleFromMemberships = async (roleId: Types.ObjectId) => {
    // Existencia de id ya viene validada, solo hay que borrar
    return await membershipRepository.removeRoleFromMemberships(roleId);
};

export const createMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await membershipRepository.createMembership(orgId, userId);
};

export const removeMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await membershipRepository.removeMembership(orgId, userId);
};

export const assignRole = async (
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    // Id viene del token de la req, no es necesario validar
    return await membershipRepository.assignRole(userId, orgId, roleId);
};

export const findMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await membershipRepository.findMembership(orgId, userId);
};

export const findEspecificRole = async (
    orgId: Types.ObjectId,
    userId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    return await membershipRepository.findEspecificRole(orgId, userId, roleId);
};

export const removeMembershipsByOrganization = async (orgId: Types.ObjectId) => {
    return await membershipRepository.removeMembershipsByOrganization(orgId);
};
