import Organization, { IOrganization } from '../models/organization.model.js';
import { DuplicateKeyError } from '../utils/customErrors.js';

export const createOrganization = async (data: Partial<IOrganization>) => {
    try {
        const organization = new Organization(data);
        return await organization.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'An organization with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const getOrganizations = async () => {
    return await Organization.find();
};

export const getOrganizationByName = async (orgName: string) => {
    return await Organization.findOne({ name: orgName });
};

export const updateOrganization = async (orgName: string, data: Partial<IOrganization>) => {
    try {
        return await Organization.findOneAndUpdate({ name: orgName }, data, { new: true });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { name?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000 && e.keyPattern?.name) {
            throw new DuplicateKeyError(
                'An organization with that name already exists',
                e.keyValue || e.message,
            );
        }
        throw err;
    }
};

export const deleteOrganization = async (orgName: string) => {
    return await Organization.findOneAndDelete({ name: orgName });
};

export const addRole = async (orgName: string, role: { name: string; description: string }) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $push: { roles: role } },
        { new: true },
    );
};

export const updateRole = async (
    orgName: string,
    oldRoleName: string,
    data: { name: string; description: string },
) => {
    // Definimos qué valores escribir (name y description) y dónde (roles...)
    const setClause: Record<string, unknown> = {
        'roles.$[roleElem].name': data.name,
        'roles.$[roleElem].description': data.description,
    };

    // Definimos que es roleElem
    const arrayFilters: Record<string, unknown>[] = [{ 'roleElem.name': oldRoleName }];

    // Solo propagamos el cambio a usersByRole si el nombre cambia (actualizamos referencias)
    if (data.name !== oldRoleName) {
        setClause['usersByRole.$[].rolesName.$[roleRef]'] = data.name;
        arrayFilters.push({ roleRef: oldRoleName });
    }

    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $set: setClause },
        { arrayFilters, new: true },
    );
};

export const deleteRole = async (orgName: string, roleName: string) => {
    // Elimina el rol del array roles y el nombre del rol de todos los rolesName en usersByRole
    await Organization.updateOne(
        { name: orgName },
        {
            $pull: {
                // borra todo lo que cumpla
                roles: { name: roleName },
                'usersByRole.$[].rolesName': roleName, //Si un usuario solo tenía ese error, la entrada queda vacía: ana -> ["admin"] ; ana -> []
            },
        },
    );
    // Elimina las entradas de usersByRole que quedaron sin ningún rol
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $pull: { usersByRole: { rolesName: { $size: 0 } } } }, // ana -> [] se elimina
        { new: true },
    );
};
