import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import { IOrganization } from '../models/organization.model.js';

const validateElementFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fields } = req.body;
        const organization = res.locals.organization as IOrganization;

        if (!fields || !Array.isArray(fields)) {
            return next();
        }

        const elementFieldsMap = new Map(organization.elementFields.map((ef) => [ef.name, ef]));

        const errors = [];

        // Validate each object in the fields array
        for (let i = 0; i < fields.length; i++) {
            const fieldObj = fields[i];

            if (!fieldObj || typeof fieldObj !== 'object' || Array.isArray(fieldObj)) {
                errors.push({
                    msg: `fields[${i}] must be an object`,
                    path: `fields[${i}]`,
                });
                continue;
            }

            // Check each key in the field object
            for (const fieldName of Object.keys(fieldObj)) {
                const orgField = elementFieldsMap.get(fieldName);

                if (!orgField) {
                    errors.push({
                        msg: `Field '${fieldName}' is not defined in organization's elementFields`,
                        path: `fields[${i}].${fieldName}`,
                    });
                }
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError('Field validation failed', errors));
        }

        next();
    } catch (err) {
        next(err);
    }
};

const validateElementPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { permissions } = req.body;
        const organization = res.locals.organization as IOrganization | undefined;

        if (!organization) {
            return next(new ValidationError('Organization not found in context'));
        }

        if (!permissions || typeof permissions !== 'object') {
            return next();
        }

        const organizationRoles = new Set(organization.roles.map((r) => r.name));

        const errors = [];

        // Validate each permission type
        for (const [permType, rolesList] of Object.entries(permissions)) {
            if (!Array.isArray(rolesList)) {
                errors.push({
                    msg: `Permission '${permType}' must be an array of role names`,
                    path: `permissions.${permType}`,
                    value: rolesList,
                });
                continue;
            }

            // Check each role exists in organization
            for (const roleName of rolesList) {
                if (typeof roleName !== 'string') {
                    errors.push({
                        msg: `Role name in '${permType}' must be a string`,
                        path: `permissions.${permType}`,
                        value: roleName,
                    });
                    continue;
                }

                if (!organizationRoles.has(roleName)) {
                    errors.push({
                        msg: `Role '${roleName}' does not exist in organization`,
                        path: `permissions.${permType}`,
                        value: roleName,
                    });
                }
            }
        }

        if (errors.length > 0) {
            return next(new ValidationError('Permission validation failed', errors));
        }

        next();
    } catch (err) {
        next(err);
    }
};

export const validateElement = [
    body('name')
        .exists({ checkNull: true })
        .withMessage('name is required')
        .isString()
        .withMessage('name must be a string')
        .notEmpty()
        .withMessage('name must not be empty')
        .isLength({ max: 100 })
        .withMessage('name must be at most 100 characters'),
    body('description')
        .exists({ checkNull: true })
        .withMessage('description is required')
        .isString()
        .withMessage('description must be a string')
        .isLength({ max: 500 })
        .withMessage('description must be at most 500 characters'),
    body('fields').exists({ checkNull: true }).isArray().withMessage('fields must be an array'),
    body('permissions')
        .exists({ checkNull: true })
        .isObject()
        .withMessage('permissions must be an object'),
    body('auditConfig')
        .exists({ checkNull: true })
        .isObject()
        .withMessage('auditConfig must be an object'),
    body('parts').exists({ checkNull: true }).isArray().withMessage('parts must be an array'),
    body('parts.*.auditConfig')
        .exists({ checkNull: true })
        .isObject()
        .withMessage('parts[].auditConfig must be an object'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
    validateElementFields,
    validateElementPermissions,
];
