import { body, param, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import * as organizationService from '../services/organization.service.js';
import * as elementService from '../services/element.service.js';
import { getOrganizationOrFail } from './organization.validator.js';

const validateElementFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fields } = req.body;
        const organization = await organizationService.getOrganizationByName(req.params.orgName);

        if (!fields || !Array.isArray(fields)) {
            return next();
        }

        const elementFieldsMap = new Map(organization!.elementFields.map((ef) => [ef.name, ef]));

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
            const orgField = elementFieldsMap.get(fieldObj.name);

            if (!orgField) {
                errors.push({
                    msg: `Field named '${fieldObj.name}' is not defined in organization's elementFields`,
                    path: `fields[${i}]`,
                });
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
        const organization = await organizationService.getOrganizationByName(req.params.orgName);

        if (!permissions || typeof permissions !== 'object') {
            return next();
        }

        const organizationRoles = new Set(organization!.roles.map((r) => r.name));

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

export const existingElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await getOrganizationOrFail(req.params.orgName);

        const element = await elementService.getElementByName(
            organization._id,
            req.params.elementName,
        );

        if (!element)
            return next(
                new NotFoundError(
                    `Element '${req.params.elementName}' not found in organization '${req.params.orgName}'`,
                ),
            );
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

export const validateElementPart = [
    body('auditConfig')
        .exists({ checkNull: true })
        .isObject()
        .withMessage('auditConfig must be an object'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateElementPartId = [
    param('partId').isMongoId().withMessage('partId must be a valid MongoDB ObjectId'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateElementPermissionRoles = [
    body('roles')
        .exists({ checkNull: true })
        .withMessage('roles is required')
        .isArray({ min: 1 })
        .withMessage('roles must be a non-empty array of role names'),
    body('roles.*').isString().withMessage('each role must be a string'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];
