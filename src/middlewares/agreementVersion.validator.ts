import { body, checkExact, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ExternalServiceError, ValidationError, NotFoundError } from '../utils/customErrors.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
import * as agreementVersionService from '../services/agreementVersion.service.js';
import {
    existingAgreementTemplate,
    existingGuaranteeTemplates,
} from './agreementTemplate.validator.js';
import { validateEventConfig } from '../integrations/computer.integration.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';

// ─── Field validations ────────────────────────────

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

const signatureMetricsValidation = [
    body('signatures.*.metrics')
        .exists({ checkNull: true })
        .withMessage('Each signature must have metrics')
        .isArray({ min: 1 })
        .withMessage('metrics must be an array with at least one entry'),
    body('signatures.*.metrics.*.metricName')
        .exists({ checkNull: true })
        .withMessage('Each metric must have a metricName')
        .isString()
        .withMessage('metricName must be a string')
        .notEmpty()
        .withMessage('metricName must not be empty'),
    body('signatures.*.metrics.*.fetcherConfigs')
        .exists({ checkNull: true })
        .withMessage('Each metric must have fetcherConfigs')
        .isArray({ min: 1 })
        .withMessage('fetcherConfigs must be an array with at least one entry'),
    body('signatures.*.metrics.*.fetcherConfigs.*.fetcherId')
        .exists({ checkNull: true })
        .withMessage('Each fetcherConfig must have a fetcherId')
        .isString()
        .withMessage('fetcherId must be a string')
        .notEmpty()
        .withMessage('fetcherId must not be empty'),
    body('signatures.*.metrics.*.fetcherConfigs.*.fetcherConfig')
        .exists({ checkNull: true })
        .withMessage('Each fetcherConfig must have a fetcherConfig')
        .isObject()
        .withMessage('fetcherConfig must be an object'),
    body('signatures.*.metrics.*.processConfig')
        .exists({ checkNull: true })
        .withMessage('Each metric must have a processConfig')
        .isObject()
        .withMessage('processConfig must be an object'),
];

const fieldValidations = [
    agreementTemplateNameValidation,
    timezoneValidation,
    initialValidation,
    endValidation,
    signaturesValidation,
    guaranteeNameValidation,
    ...signatureMetricsValidation,
];

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

// ─── Business logic validations ─────────────────────────────────

const endAfterInitial = (req: Request, res: Response, next: NextFunction) => {
    const { initial, end } = req.body.contract.validity;
    if (new Date(end) <= new Date(initial))
        return next(
            new ValidationError('contract.validity.end must be after contract.validity.initial'),
        );
    next();
};

export const existingAuditableVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColName,
        );

        if (collection!.auditableVersionNumber === null)
            return next(new NotFoundError('No auditable version in this collection'));
        next();
    } catch (err) {
        next(err);
    }
};

export const existingSelectedAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColId,
        );
        agreementVersionService.resolveAgreementVersionSelector(
            collection!,
            req.params.agreementVersion,
        );
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
        const collection = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeId,
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

const validateSignatureConfigsInExternalServices = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const errors: string[] = [];

        for (const sig of req.body.signatures) {
            const guaranteeTemplate = await guaranteeTemplateService.getGuaranteeTemplateByName(
                sig.guaranteeName,
            );

            for (const metric of sig.metrics) {
                const templateMetric = guaranteeTemplate!.metrics.find(
                    (m) => m.metricName === metric.metricName,
                );

                // Validate that the given metrics exist in the template
                if (!templateMetric) {
                    errors.push(
                        `${sig.guaranteeName}: metricName '${metric.metricName}' not found in template`,
                    );
                    continue;
                }

                const eventError = await validateEventConfig(
                    templateMetric.metricConfig.event.eventId,
                    metric.fetcherConfigs,
                    metric.processConfig,
                );
                if (eventError) errors.push(`${sig.guaranteeName}: ${eventError}`);
            }
        }

        if (errors.length > 0)
            return next(new ValidationError(`Signature validation failed: ${errors.join('; ')}`));
        next();
    } catch (error) {
        return next(
            new ExternalServiceError(
                'External validation service failed',
                error instanceof Error ? { message: error.message } : error,
            ),
        );
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
    validateSignatureConfigsInExternalServices,
];
