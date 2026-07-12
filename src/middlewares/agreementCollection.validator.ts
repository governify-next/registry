import { body, checkExact, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, DuplicateKeyError, NotFoundError } from '../utils/customErrors.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';

// ─── Validaciones de campo ────────────────────────────

const nameValidation = body('name')
    .exists({ checkNull: true })
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string')
    .notEmpty()
    .withMessage('name must not be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('name must be between 3 and 100 characters')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('name can only contain letters, numbers, hyphens and underscores');

const displayNameValidation = body('displayName')
    .exists({ checkNull: true })
    .withMessage('displayName is required')
    .isString()
    .withMessage('displayName must be a string')
    .isLength({ max: 200 })
    .withMessage('displayName must be at most 200 characters');

const fieldsValidation = body('fields')
    .exists({ checkNull: true })
    .withMessage('fields is required');

const permissionsValidation = body('permissions')
    .exists({ checkNull: true })
    .withMessage('permissions is required');

const auditableVersionNumberValidation = body('auditableVersionNumber')
    .exists({ checkNull: false })
    .withMessage('auditableVersionNumber is required (use null if not applicable)')
    .custom((value) => {
        if (value === null) return true;
        if (!Number.isInteger(value) || value < 1) {
            throw new Error('auditableVersionNumber must be a positive integer or null');
        }
        return true;
    });

const fieldValidations = [
    nameValidation,
    displayNameValidation,
    fieldsValidation,
    permissionsValidation,
];

const updateFieldValidations = [...fieldValidations, auditableVersionNumberValidation];

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

// ─── Validaciones de lógica de negocio ─────────────────────────────────

const uniqueAgreementCollectionInScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        // Si es update y el nombre no cambió, no hay conflicto
        if (req.params.agColName && req.params.agColName === req.body.name) return next();

        const existing = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeName,
            req.body.name,
        );

        if (existing)
            return next(
                new DuplicateKeyError(
                    `An AgreementCollection with name '${req.body.name}' already exists in this scope`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const existingAgreementCollection = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeName,
            req.params.agColName,
        );

        if (!collection)
            return next(
                new NotFoundError(`AgreementCollection '${req.params.agColName}' not found`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

const validAuditableVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { auditableVersionNumber } = req.body;

        // Si es null, no hay nada que validar
        if (auditableVersionNumber === null) return next();

        const collection = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeName,
            req.params.agColName,
        );

        const version = collection!.agreementVersions.find(
            (v) => v.versionNumber === auditableVersionNumber,
        );

        if (!version)
            return next(
                new ValidationError(
                    `Version ${auditableVersionNumber} does not exist in this AgreementCollection`,
                ),
            );

        if (version.contract.validity.earlyTermination)
            return next(
                new ValidationError(
                    `Version ${auditableVersionNumber} has been terminated and cannot be set as auditable`,
                ),
            );

        next();
    } catch (err) {
        next(err);
    }
};

// ─── Middleware ────────────────────────────────────────────────────

export const validateCreateAgreementCollection = [
    checkExact(fieldValidations, { locations: ['body'] }), // TODO: seguir esta técnica en el resto de middlewares
    collectValidationErrors,
    uniqueAgreementCollectionInScope,
];

export const validateUpdateAgreementCollection = [
    checkExact(updateFieldValidations, { locations: ['body'] }), // cualquier campo no presente en las validaciones será rechazado
    collectValidationErrors,
    existingAgreementCollection,
    uniqueAgreementCollectionInScope,
    validAuditableVersion,
];
