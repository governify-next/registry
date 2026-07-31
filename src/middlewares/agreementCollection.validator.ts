import { body, checkExact, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, DuplicateKeyError, NotFoundError } from '../utils/customErrors.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';

// ─── Field validations ────────────────────────────

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

// ─── Business logic validations ─────────────────────────────────

const uniqueAgreementCollectionInScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const existing = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeId,
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

const uniqueAgreementCollectionOnUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const collection = await agreementCollectionService.getAgreementCollectionById(
            req.params.agColId,
        );

        if (collection!.name === req.body.name) return next();

        const existing = await agreementCollectionService.getAgreementCollectionByScopeIdAndName(
            collection!.scopeId,
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
            req.params.scopeId,
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

export const existingAgreementCollectionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const collection = await agreementCollectionService.getAgreementCollectionById(
            req.params.agColId,
        );

        if (!collection)
            return next(
                new NotFoundError(`AgreementCollection with id'${req.params.agColId}' not found`),
            );

        // Check that the collection belongs to the organization through its scopeId
        const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(
            req.params.orgName,
            collection.scopeId.toString(),
        );

        if (!scope)
            return next(
                new NotFoundError(
                    `AgreementCollection with id'${req.params.agColId}' not found in organization '${req.params.orgName}'`,
                ),
            );

        next();
    } catch (err) {
        next(err);
    }
};

const validAuditableVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { auditableVersionNumber } = req.body;

        // If it is null there is nothing to validate
        if (auditableVersionNumber === null) return next();

        const collection = await agreementCollectionService.getAgreementCollectionById(
            req.params.agColId,
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
    checkExact(fieldValidations, { locations: ['body'] }), // TODO: follow this technique in the rest of the middlewares
    collectValidationErrors,
    uniqueAgreementCollectionInScope,
];

export const validateUpdateAgreementCollection = [
    checkExact(updateFieldValidations, { locations: ['body'] }), // any field not present in the validations will be rejected
    collectValidationErrors,
    uniqueAgreementCollectionOnUpdate,
    validAuditableVersion,
];
