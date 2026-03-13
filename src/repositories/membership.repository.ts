import Membership from '../models/membership.model.js';

// Método interno para el borrado en cascada de un rol
export const removeRoleFromMemberships = async (roleId: string) => {
    // Borramos el roleId de los arrays de rolesId en los que aparezca
    await Membership.updateMany({ rolesId: roleId }, { $pull: { rolesId: roleId } });
    // Si un array de rolesId queda huérfano (vacío), lo eliminamos
    return await Membership.deleteMany({ rolesId: { $size: 0 } });
};
