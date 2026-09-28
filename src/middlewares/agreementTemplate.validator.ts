import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import * as agreementTemplateService from '../services/agreementTemplate.service.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import { getOrganizationOrFail } from './organization.validator.js';
import { DuplicateKeyError, ValidationError, NotFoundError } from '../utils/customErrors.js';
import { validateGuaranteeWindow } from './window.validator.js';
import { fromPeriodToMilliseconds } from '../utils/window.util.js';
import type { IAgreementTemplateGuaranteeInput } from '../types/agreementTemplate.types.js';
import { comparators } from '../types/comparator.types.js';

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

const descriptionValidation = body('description')
    .exists({ checkNull: true })
    .withMessage('description is required')
    .isString()
    .withMessage('description must be a string')
    .isLength({ max: 500 })
    .withMessage('description must be at most 500 characters');

const displayNameValidation = body('displayName')
    .exists({ checkNull: true })
    .withMessage('displayName is required')
    .isString()
    .withMessage('displayName must be a string')
    .isLength({ max: 200 })
    .withMessage('displayName must be at most 200 characters');

const isPublicValidation = body('isPublic')
    .exists({ checkNull: true })
    .withMessage('isPublic is required')
    .isBoolean()
    .withMessage('isPublic must be a boolean');

const guaranteesStructureValidation = [
    body('guarantees')
        .exists({ checkNull: true })
        .withMessage('guarantees is required')
        .isArray({ min: 1 })
        .withMessage('guarantees must be an array with at least one entry'),
    body('guarantees.*.guaranteeTemplateName')
        .exists({ checkNull: true })
        .withMessage('Each guarantee entry must have a guaranteeTemplateName')
        .isString()
        .withMessage('guaranteeTemplateName must be a string')
        .notEmpty()
        .withMessage('guaranteeTemplateName must not be empty')
        .isLength({ min: 3, max: 100 })
        .withMessage('guaranteeTemplateName must be between 3 and 100 characters'),
    body('guarantees.*.comparator')
        .exists({ checkNull: true })
        .withMessage('Each guarantee entry must have a comparator')
        .isString()
        .withMessage('comparator must be a string')
        .isIn(comparators)
        .withMessage('comparator must be one of: <, >, <=, >=, ==, !='),
    body('guarantees.*.threshold')
        .exists({ checkNull: true })
        .withMessage('Each guarantee entry must have a threshold')
        .isNumeric()
        .withMessage('threshold must be a number'),
    ...validateGuaranteeWindow('window'),
    ...validateGuaranteeWindow('evolutiveWindow', true),
];

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

// Run only after structure validation so malformed periods produce field errors, not exceptions.
const evolutivePeriodValidation = body('guarantees.*').custom(
    (guarantee: IAgreementTemplateGuaranteeInput) => {
        if (guarantee.evolutiveWindow === null) return true;
        const period = fromPeriodToMilliseconds(guarantee.window.period);
        const evolutivePeriod = fromPeriodToMilliseconds(guarantee.evolutiveWindow.period);
        if (
            !Number.isFinite(period) ||
            !Number.isFinite(evolutivePeriod) ||
            evolutivePeriod >= period
        ) {
            throw new Error('evolutiveWindow.period must be strictly shorter than window.period');
        }
        return true;
    },
);

// ─── Business logic validations ─────────────────────────────────

export const existingGuaranteeTemplates = (getNames: (req: Request) => string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const guaranteeTemplatesNames = getNames(req);
            const uniqueNames = [...new Set(guaranteeTemplatesNames)];
            const guaranteeTemplatesFromDb =
                await guaranteeTemplateService.findGuaranteeTemplatesByName(uniqueNames);
            const foundNames = guaranteeTemplatesFromDb.map((gt) => gt.name);
            const missing = uniqueNames.filter((name) => !foundNames.includes(name));

            if (missing.length > 0)
                return next(
                    new NotFoundError(`GuaranteeTemplates not found: ${missing.join(', ')}`),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

const uniqueAgreementTemplateInOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await getOrganizationOrFail(req.params.orgName);

        // If there is a param it is an update -> no conflict if the param name equals the body one
        if (req.params.agreementTemplateName && req.params.agreementTemplateName === req.body.name)
            return next();

        const existingAgreementTemplate =
            await agreementTemplateService.getCleanAgreementTemplateByOrganization(
                organization!._id,
                req.body.name,
            );
        if (existingAgreementTemplate) {
            return next(
                new DuplicateKeyError(
                    `An AgreementTemplate with that name already exists in the organization!`,
                ),
            );
        }
        next();
    } catch (err) {
        next(err);
    }
};

const noDuplicateGuaranteeTemplateNames = (req: Request, res: Response, next: NextFunction) => {
    try {
        const guaranteeTemplatesNames: string[] = req.body.guarantees.map(
            (g: { guaranteeTemplateName: string }) => g.guaranteeTemplateName,
        );
        const diffNames = new Set(guaranteeTemplatesNames).size;
        if (diffNames < guaranteeTemplatesNames.length)
            return next(
                new ValidationError(
                    `You can only have one Guarantee for a GuaranteeTemplate in an AgreementTemplate!`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const existingAgreementTemplate = (getTemplateName: (req: Request) => string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const organization = await getOrganizationOrFail(req.params.orgName);

            const agreementTemplate =
                await agreementTemplateService.getCleanAgreementTemplateByOrganization(
                    organization._id,
                    getTemplateName(req),
                );

            if (!agreementTemplate)
                return next(
                    new NotFoundError(`AgreementTemplate '${getTemplateName(req)}' not found`),
                );
            next();
        } catch (err) {
            next(err);
        }
    };
};

// ─── Middleware ────────────────────────────────────────────────────

export const validateCreateAgreementTemplate = [
    // Field validation
    nameValidation,
    descriptionValidation,
    displayNameValidation,
    isPublicValidation,
    ...guaranteesStructureValidation,
    collectValidationErrors,
    evolutivePeriodValidation,
    collectValidationErrors,
    // Logic validation
    uniqueAgreementTemplateInOrganization,
    existingGuaranteeTemplates((req) =>
        req.body.guarantees.map((g: { guaranteeTemplateName: string }) => g.guaranteeTemplateName),
    ),
    noDuplicateGuaranteeTemplateNames,
];

export const validateUpdateAgreementTemplate = [
    // Field validation
    nameValidation,
    descriptionValidation,
    displayNameValidation,
    isPublicValidation,
    ...guaranteesStructureValidation,
    collectValidationErrors,
    evolutivePeriodValidation,
    collectValidationErrors,
    // Logic validation
    existingAgreementTemplate((req) => req.params.agreementTemplateName),
    uniqueAgreementTemplateInOrganization,
    existingGuaranteeTemplates((req) =>
        req.body.guarantees.map((g: { guaranteeTemplateName: string }) => g.guaranteeTemplateName),
    ),
    noDuplicateGuaranteeTemplateNames,
];
