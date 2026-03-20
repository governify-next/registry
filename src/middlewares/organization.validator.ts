import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import {
    ValidationError,
    DuplicateKeyError,
    LimitError,
    ForbiddenError,
} from '../utils/customErrors.js';
import { getOrganizationByName } from '../services/organization.service.js';
import { findEspecificRole } from '../services/membership.service.js';
import { IOrganization } from '../models/organization.model.js';

// Helper
export async function getOrganizationOrFail(orgName: string): Promise<IOrganization> {
    const org = await getOrganizationByName(orgName);
    if (!org) throw new ValidationError(`Organization with name ${orgName} does not exist`);
    return org;
}

const nameValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .notEmpty()
        .withMessage(`${field} must not be empty`)
        .isLength({ min: 3, max: 100 })
        .withMessage(`${field} must be between 3 and 100 characters`);

const descriptionValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .isLength({ min: 3, max: 500 })
        .withMessage(`${field} must be between 3 and 500 characters`);

const typeValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .notEmpty()
        .withMessage(`${field} must not be empty`)
        .isLength({ max: 50 })
        .withMessage(`${field} must be at most 50 characters`)
        .toLowerCase();

const valueValidation = (field: string) => {
    // Extraemos el valor de field 'value'
    return body(field).custom((value, meta) => {
        // Si type es enum
        if (meta.req.body.type === 'enum') {
            // Debe existir value
            if (value === undefined) {
                throw new Error("The 'value' field should be defined if 'type' is 'enum'");
            }
            // Debe ser Array
            if (!Array.isArray(value)) {
                throw new Error("The 'value' field must be defined as a list if 'type' is 'enum'");
            }
        } else {
            if (value !== undefined) {
                throw new Error("The 'value' field should only be defined if 'type' is 'enum'");
            }
        }
        return true;
    });
};

const displayNameValidation = body('displayName')
    .optional()
    .isString()
    .withMessage('displayName must be a string')
    .isLength({ max: 200 })
    .withMessage('displayName must be at most 100 characters');

const orgNameFormat = body('name')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Organization name can only contain letters, numbers and hyphens');

export const validateOrganization = [
    nameValidation('name'),
    orgNameFormat,
    displayNameValidation,
    descriptionValidation('description'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const validateRole = [
    nameValidation('name'),
    descriptionValidation('description'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const validateField = [
    nameValidation('name'),
    descriptionValidation('description'),
    typeValidation('type'),
    valueValidation('value'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const existingOrganization = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.orgName) return next(new ValidationError('Organization name is required'));

    try {
        await getOrganizationOrFail(req.params.orgName);
        next();
    } catch (err) {
        next(err);
    }
};

export const existingRole = (source: 'body' | 'params') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const roleName = req[source].roleName;
        if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
        if (!roleName) return next(new ValidationError('Role name is required'));

        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const role = organization.roles.find((r) => r.name === roleName);

            if (!role)
                return next(
                    new ValidationError(
                        `Role '${roleName}' not found in organization '${organization.name}'`,
                    ),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const existingField = (arrayName: 'elementFields' | 'agreementFields') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
        if (!req.params.fieldName) return next(new ValidationError('Field name is required'));

        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const field = organization[arrayName].find((f) => f.name === req.params.fieldName);

            if (!field)
                return next(
                    new ValidationError(
                        `${arrayName} '${req.params.fieldName}' not found in organization '${organization.name}'`,
                    ),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const uniqueRole = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
    const { roleName } = req.params;
    const newName = req.body.name;
    // Si es update y el nombre no cambió, no hay conflicto
    if (roleName && newName === roleName) return next();

    try {
        const organization = await getOrganizationOrFail(req.params.orgName);
        if (organization.roles.some((r) => r.name === newName))
            return next(
                new DuplicateKeyError(
                    `Role '${newName}' already exists in organization '${organization.name}'`,
                    {},
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const maxRoles = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
    try {
        const max = parseInt(process.env.MAX_ROLES_PER_ORGANIZATION || '100', 10);
        const organization = await getOrganizationOrFail(req.params.orgName);
        if (organization.roles.length >= max)
            return next(
                new LimitError(
                    `Organization '${organization.name}' has reached the maximum limit of ${max} roles.`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const uniqueField = (arrayName: 'elementFields' | 'agreementFields') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
        const { fieldName } = req.params;
        const newName = req.body.name;
        // Si es update y el nombre no cambió, no hay conflicto
        if (fieldName && newName === fieldName) return next();

        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            if (organization[arrayName].some((f) => f.name === newName))
                return next(
                    new DuplicateKeyError(
                        `${arrayName} '${newName}' already exists in organization '${organization.name}'`,
                        {},
                    ),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const hasOrgRole = (roleName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const roleId = organization.roles.find((r) => r.name === roleName)?._id;

            if (!roleId)
                return next(
                    new ValidationError(
                        `Role '${roleName}' not found in organization '${organization.name}'`,
                    ),
                );

            // Buscamos si el usuario tiene ese rol en la organización
            const hasRole = await findEspecificRole(organization._id, req.auth!.userId, roleId);

            if (!hasRole)
                return next(
                    new ForbiddenError(`You do not have permission to perform that action`),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

export const notAdminRole = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.roleName) return next(new ValidationError('Role name is required'));
    if (req.params.roleName === 'admin')
        return next(
            new ForbiddenError(`Admin role can not be removed/modified from organizations`),
        );

    next();
};
