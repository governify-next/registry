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
