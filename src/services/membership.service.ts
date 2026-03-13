import * as membershipRepository from '../repositories/membership.repository.js';

export const removeRoleFromMemberships = async (roleId: string) => {
    // Existencia de id ya viene validada
    return await membershipRepository.removeRoleFromMemberships(roleId);
};
