import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

// Primitivos para los subcampos

const subNameValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .notEmpty()
        .withMessage(`${field} must not be empty`)
        .isLength({ max: 100 })
        .withMessage(`${field} must be at most 100 characters`);

const subDescriptionValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .isLength({ max: 500 })
        .withMessage(`${field} must be at most 500 characters`);

const subTypeValidation = (field: string) =>
    body(field)
        .exists({ checkNull: true })
        .withMessage(`${field} is required`)
        .isString()
        .withMessage(`${field} must be a string`)
        .notEmpty()
        .withMessage(`${field} must not be empty`)
        .isLength({ max: 50 })
        .withMessage(`${field} must be at most 50 characters`);

export const validateOrganization = [
    subNameValidation('name'),
    subDescriptionValidation('description'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const validateRole = [
    subNameValidation('name'),
    subDescriptionValidation('description'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];

export const validateField = [
    subNameValidation('name'),
    subDescriptionValidation('description'),
    subTypeValidation('type'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];
