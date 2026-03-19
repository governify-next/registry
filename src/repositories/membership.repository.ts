import { Types } from 'mongoose';
import Membership from '../models/membership.model.js';

// Método interno para el borrado en cascada de un rol
export const removeRoleFromMemberships = async (roleId: Types.ObjectId) => {
    // bulk da rendimiento (ejecuta las dos operaciones como un paquete) y seguridad (no hay estado intermedio)
    return await Membership.bulkWrite([
        {
            // Borramos el roleId de los arrays de rolesId en los que aparezca
            updateMany: { filter: { rolesId: roleId }, update: { $pull: { rolesId: roleId } } },
        },
        {
            // Si un array de rolesId queda huérfano (vacío), lo eliminamos
            deleteMany: { filter: { rolesId: { $size: 0 } } },
        },
    ]);
};

export const findMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await Membership.findOne({ organizationId: orgId, userId: userId });
};

export const findEspecificRole = async (
    orgId: Types.ObjectId,
    userId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    return await Membership.findOne({ organizationId: orgId, userId: userId, rolesId: roleId });
};

export const createMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await Membership.create({ organizationId: orgId, userId: userId });
};

export const removeMembership = async (orgId: Types.ObjectId, userId: Types.ObjectId) => {
    return await Membership.deleteOne({ organizationId: orgId, userId: userId });
};

export const assignRole = async (
    userId: Types.ObjectId,
    orgId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    // Usamos upsert, si no existe la membership la crea, si existe añade el rol
    return await Membership.findOneAndUpdate(
        { organizationId: orgId, userId: userId },
        { $addToSet: { rolesId: roleId } }, // addToSet previene duplicados e inicializa el array si es necesario
        { upsert: true, new: true },
    );
};

export const unassignRole = async (
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    roleId: Types.ObjectId,
) => {
    return await Membership.findOneAndUpdate(
        { organizationId, userId },
        { $pull: { rolesId: roleId } },
        { new: true },
    );
};

export const removeMembershipsByOrganization = async (orgId: Types.ObjectId) => {
    return await Membership.deleteMany({ organizationId: orgId });
};
