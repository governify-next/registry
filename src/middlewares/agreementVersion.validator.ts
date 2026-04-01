import { body, checkExact, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, NotFoundError } from '../utils/customErrors.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
import {
    existingAgreementTemplate,
    existingGuaranteeTemplates,
} from './agreementTemplate.validator.js';

// ─── Validaciones de campo ────────────────────────────

const agreementTemplateNameValidation = body('contract.agreementTemplateName')
    .exists({ checkNull: true })
    .withMessage('contract.agreementTemplateName is required')
    .isString()
    .withMessage('contract.agreementTemplateName must be a string')
    .notEmpty()
    .withMessage('contract.agreementTemplateName must not be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('name must be between 3 and 100 characters');

const timezoneValidation = body('contract.validity.timezone')
    .exists({ checkNull: true })
    .withMessage('contract.validity.timezone is required')
    .isString()
    .withMessage('contract.validity.timezone must be a string')
    .notEmpty()
    .withMessage('contract.validity.timezone must not be empty')
    .custom((value) => {
        if (!Intl.supportedValuesOf('timeZone').includes(value))
            throw new Error('contract.validity.timezone must be a valid IANA timezone');
        return true;
    });

const initialValidation = body('contract.validity.initial')
    .exists({ checkNull: true })
    .withMessage('contract.validity.initial is required')
    .isISO8601()
    .withMessage('contract.validity.initial must be a valid ISO8601 date');

const endValidation = body('contract.validity.end')
    .exists({ checkNull: true })
    .withMessage('contract.validity.end is required')
    .isISO8601()
    .withMessage('contract.validity.end must be a valid ISO8601 date');

const signaturesValidation = body('signatures')
    .exists({ checkNull: true })
    .withMessage('signatures is required')
    .isArray({ min: 1 })
    .withMessage('signatures must be an array with at least one entry');

const guaranteeNameValidation = body('signatures.*.guaranteeName')
    .exists({ checkNull: true })
    .withMessage('Each signature must have a guaranteeName')
    .isString()
    .withMessage('guaranteeName must be a string')
    .notEmpty()
    .withMessage('guaranteeName must not be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('name must be between 3 and 100 characters');

const auditConfigValidation = body('signatures.*.auditConfig')
    .exists({ checkNull: true })
    .withMessage('Each signature must have an auditConfig')
    .isObject()
    .withMessage('auditConfig must be an object');

const fieldValidations = [
    agreementTemplateNameValidation,
    timezoneValidation,
    initialValidation,
    endValidation,
    signaturesValidation,
    guaranteeNameValidation,
    auditConfigValidation,
];

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

// ─── Validaciones de lógica de negocio ─────────────────────────────────

const endAfterInitial = (req: Request, res: Response, next: NextFunction) => {
    const { initial, end } = req.body.contract.validity;
    if (new Date(end) <= new Date(initial))
        return next(
            new ValidationError('contract.validity.end must be after contract.validity.initial'),
        );
    next();
};

export const existingVersionNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByElement(
            req.params.orgName,
            req.params.elementName,
            req.params.agColName,
        );

        const versionNumber = Number(req.params.versionNumber);
        if (!Number.isInteger(versionNumber) || versionNumber < 1)
            return next(new ValidationError('versionNumber must be a positive integer'));

        const version = collection!.agreementVersions.find(
            (v) => v.versionNumber === versionNumber,
        );
        if (!version)
            return next(new NotFoundError(`Version ${versionNumber} not found in this collection`));
        next();
    } catch (err) {
        next(err);
    }
};

export const existingAuditableVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByElement(
            req.params.orgName,
            req.params.elementName,
            req.params.agColName,
        );

        if (collection!.auditableVersionNumber === null)
            return next(new NotFoundError('No auditable version in this collection'));
        next();
    } catch (err) {
        next(err);
    }
};

const earlyTerminationValidation = body('earlyTermination')
    .exists({ checkNull: true })
    .withMessage('earlyTermination is required')
    .isISO8601()
    .withMessage('earlyTermination must be a valid ISO8601 date');

const earlyTerminationInRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByElement(
            req.params.orgName,
            req.params.elementName,
            req.params.agColName,
        );

        const version = collection!.agreementVersions.find(
            (v) => v.versionNumber === collection!.auditableVersionNumber,
        );

        const earlyTermination = new Date(req.body.earlyTermination);
        const initial = new Date(version!.contract.validity.initial);
        const end = new Date(version!.contract.validity.end);

        if (earlyTermination <= initial || earlyTermination >= end)
            return next(
                new ValidationError(
                    'earlyTermination must be after validity.initial and before validity.end',
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

// ─── Middleware ────────────────────────────────────────────────────

export const validateTerminateVersion = [
    checkExact([earlyTerminationValidation], { locations: ['body'] }),
    collectValidationErrors,
    existingAuditableVersion,
    earlyTerminationInRange,
];

export const validateCreateAgreementVersion = [
    checkExact(fieldValidations, { locations: ['body'] }),
    collectValidationErrors,
    endAfterInitial,
    existingAgreementTemplate((req) => req.body.contract.agreementTemplateName),
    existingGuaranteeTemplates((req) =>
        req.body.signatures.map((s: { guaranteeName: string }) => s.guaranteeName),
    ),
];
