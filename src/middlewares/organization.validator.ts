import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

// Primitivos para los subcampos

const subNameValidation = (field: string) =>
    body(field)
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

// Validaciones para los arrays de subdocumentos

const fieldValidation = (arrayName: string) => [
    subNameValidation(`${arrayName}.*.name`),
    subDescriptionValidation(`${arrayName}.*.description`),
    body(`${arrayName}.*.type`)
        .isString()
        .withMessage(`${arrayName}[].type must be a string`)
        .notEmpty()
        .isLength({ max: 50 })
        .withMessage(`${arrayName}[].type must be at most 50 characters`),
];

const roleValidation = () => [
    subNameValidation('roles.*.name'),
    subDescriptionValidation('roles.*.description'),
];

export const validateOrganization = [
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

    // Arrays de fields (mongoose inicializa a [] si no se mandan)
    body('elementFields').optional().isArray().withMessage('elementFields must be an array'),
    body('agreementFields').optional().isArray().withMessage('agreementFields must be an array'),
    ...fieldValidation('elementFields'),
    ...fieldValidation('agreementFields'),

    // Roles
    body('roles').optional().isArray().withMessage('roles must be an array'),
    ...roleValidation(),

    // UsersByRole
    body('usersByRole').optional().isArray().withMessage('usersByRole must be an array'),
    body('usersByRole.*.userName')
        .isString()
        .withMessage('usersByRole[].userName must be a string')
        .notEmpty()
        .withMessage('usersByRole[].userName must not be empty')
        .isLength({ max: 100 })
        .withMessage('usersByRole[].userName must be at most 100 characters'),
    body('usersByRole.*.rolesName')
        .isArray({ min: 1 }) // Actúa en cada entrada de usersByRole. Si llega aquí es porque hay entrada, entonces mínimo tiene que haber un rol definido
        .withMessage('usersByRole[].rolesName must be a non-empty array'),
    body('usersByRole.*.rolesName.*')
        .isString()
        .withMessage('usersByRole[].rolesName elements must be strings')
        .notEmpty()
        .withMessage('usersByRole[].rolesName elements must not be empty')
        .isLength({ max: 100 })
        .withMessage('usersByRole[].rolesName elements must be at most 100 characters'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return next(new ValidationError('Validation failed', errors.array()));
        next();
    },
];
