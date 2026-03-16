import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

const nameValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .notEmpty()
        .withMessage(`${field} must not be empty`)
        .isLength({ max: 100 })
        .withMessage(`${field} must be at most 100 characters`);

const descriptionValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .isLength({ max: 500 })
        .withMessage(`${field} must be at most 500 characters`);

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

export const validateOrganization = [
    nameValidation('name'),
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
