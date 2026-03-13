import { Types } from 'mongoose';
import * as membershipRepository from '../repositories/membership.repository.js';

export const removeRoleFromMemberships = async (roleId: Types.ObjectId) => {
    // Existencia de id ya viene validada, solo hay que borrar
    return await membershipRepository.removeRoleFromMemberships(roleId);
};
