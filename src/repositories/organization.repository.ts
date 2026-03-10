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
    // 1. Elimina el rol del array de roles
    await Organization.updateOne({ name: orgName }, { $pull: { roles: { name: roleName } } });
    // 2. Elimina el roleName de todos los rolesName usando el arrayFilters
    await Organization.updateMany(
        { name: orgName },
        { $pull: { 'usersByRole.$[elem].rolesName': roleName } },
        { arrayFilters: [{ 'elem.rolesName': roleName }] }, // ana -> ["admin"] ; ana -> []
    );
    // 3. Limpia las entradas huérfanas (los usuarios que se quedaron sin roles)
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $pull: { usersByRole: { rolesName: { $size: 0 } } } },
        { new: true },
    );
};

// Fields genéricos para que elementFields y agreementFields compartan la misma lógica

export type FieldArrayName = 'elementFields' | 'agreementFields';
type FieldData = { name: string; description: string; type: string; value?: unknown };

export const addField = async (orgName: string, arrayName: FieldArrayName, field: FieldData) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $push: { [arrayName]: field } },
        { new: true },
    );
};

export const updateField = async (
    orgName: string,
    arrayName: FieldArrayName,
    oldFieldName: string,
    data: FieldData,
) => {
    const setClause: Record<string, unknown> = {
        [`${arrayName}.$[fieldElem].name`]: data.name,
        [`${arrayName}.$[fieldElem].description`]: data.description,
        [`${arrayName}.$[fieldElem].type`]: data.type,
    };
    // Solo se actualiza value si fue enviado en el body
    if ('value' in data) setClause[`${arrayName}.$[fieldElem].value`] = data.value;

    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $set: setClause },
        { arrayFilters: [{ 'fieldElem.name': oldFieldName }], new: true },
    );
};

export const deleteField = async (
    orgName: string,
    arrayName: FieldArrayName,
    fieldName: string,
) => {
    return await Organization.findOneAndUpdate(
        { name: orgName },
        { $pull: { [arrayName]: { name: fieldName } } },
        { new: true },
    );
};
