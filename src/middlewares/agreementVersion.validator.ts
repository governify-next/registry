import { body, checkExact, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ExternalServiceError, ValidationError, NotFoundError } from '../utils/customErrors.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
import * as agreementVersionService from '../services/agreementVersion.service.js';
import { validateEventConfig } from '../integrations/computer.integration.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as agreementTemplateService from '../services/agreementTemplate.service.js';
import * as guaranteeService from '../services/guarantee.service.js';
import { getOrganizationOrFail } from './organization.validator.js';

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

export const validateSignaturesAgainstAgreementTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementTemplateName = req.body.contract.agreementTemplateName;
        const requestedGuaranteeNames = [
            ...new Set<string>(
                req.body.signatures.map(
                    (signature: { guaranteeName: string }) => signature.guaranteeName,
                ),
            ),
        ];
        const organization = await getOrganizationOrFail(req.params.orgName);
        const agreementTemplate =
            await agreementTemplateService.getCleanAgreementTemplateByOrganization(
                organization._id,
                agreementTemplateName,
            );

        if (!agreementTemplate) {
            return next(
                new NotFoundError(`AgreementTemplate '${agreementTemplateName}' not found`),
            );
        }

        const guaranteeTemplates =
            await guaranteeTemplateService.findGuaranteeTemplatesByName(requestedGuaranteeNames);
        const guaranteeTemplatesByName = new Map(
            guaranteeTemplates.map((guaranteeTemplate) => [
                guaranteeTemplate.name,
                guaranteeTemplate,
            ]),
        );
        const missingGuaranteeNames = requestedGuaranteeNames.filter(
            (guaranteeName) => !guaranteeTemplatesByName.has(guaranteeName),
        );

        if (missingGuaranteeNames.length > 0) {
            return next(
                new NotFoundError(
                    `GuaranteeTemplates not found: ${missingGuaranteeNames.join(', ')}`,
                ),
            );
        }

        const configuredGuarantees = await guaranteeService.getGuaranteesByAgreementTemplateId(
            agreementTemplate._id,
        );
        const configuredGuaranteeTemplateIds = new Set(
            configuredGuarantees.map((guarantee) => guarantee.guaranteeTemplateId.toString()),
        );
        const unconfiguredGuaranteeNames = requestedGuaranteeNames.filter((guaranteeName) => {
            const guaranteeTemplate = guaranteeTemplatesByName.get(guaranteeName)!;
            return !configuredGuaranteeTemplateIds.has(guaranteeTemplate._id.toString());
        });

        if (unconfiguredGuaranteeNames.length > 0) {
            return next(
                new ValidationError(
                    `GuaranteeTemplates are not configured in AgreementTemplate '${agreementTemplateName}': ${unconfiguredGuaranteeNames.join(', ')}`,
                    {
                        agreementTemplateName,
                        guaranteeNames: unconfiguredGuaranteeNames,
                    },
                ),
            );
        }

        next();
    } catch (err) {
        next(err);
    }
};

export const existingAuditableVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const collection = await agreementCollectionService.getCleanAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColId,
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
            req.params.agColId,
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
        const signatureErrors: {
            signatureIndex: number;
            metricIndex?: number;
            guaranteeName: string;
            metricName?: string;
            reason: string;
            eventId?: string;
            issues?: unknown[];
        }[] = [];
        const guaranteeNames = [
            ...new Set<string>(
                req.body.signatures.map(
                    (signature: { guaranteeName: string }) => signature.guaranteeName,
                ),
            ),
        ];
        const guaranteeTemplates =
            await guaranteeTemplateService.findGuaranteeTemplatesByName(guaranteeNames);
        const guaranteeTemplatesByName = new Map(
            guaranteeTemplates.map((guaranteeTemplate) => [
                guaranteeTemplate.name,
                guaranteeTemplate,
            ]),
        );
        const validationJobs: {
            signatureIndex: number;
            metricIndex: number;
            guaranteeName: string;
            metricName: string;
            eventId: string;
            fetcherConfigs: {
                fetcherId: string;
                fetcherConfig: Record<string, unknown>;
            }[];
            processConfig: Record<string, unknown>;
        }[] = [];

        for (const [signatureIndex, sig] of req.body.signatures.entries()) {
            const guaranteeTemplate = guaranteeTemplatesByName.get(sig.guaranteeName);
            if (!guaranteeTemplate) {
                signatureErrors.push({
                    signatureIndex,
                    guaranteeName: sig.guaranteeName,
                    reason: 'GuaranteeTemplate not found',
                });
                continue;
            }

            for (const [metricIndex, metric] of sig.metrics.entries()) {
                const templateMetric = guaranteeTemplate.metrics.find(
                    (m) => m.metricName === metric.metricName,
                );

                // Validate that the given metrics exist in the template
                if (!templateMetric) {
                    signatureErrors.push({
                        signatureIndex,
                        metricIndex,
                        guaranteeName: sig.guaranteeName,
                        metricName: metric.metricName,
                        reason: 'Metric not found in GuaranteeTemplate',
                    });
                    continue;
                }

                validationJobs.push({
                    signatureIndex,
                    metricIndex,
                    guaranteeName: sig.guaranteeName,
                    metricName: metric.metricName,
                    eventId: templateMetric.metricConfig.event.eventId,
                    fetcherConfigs: metric.fetcherConfigs,
                    processConfig: metric.processConfig,
                });
            }
        }

        const computerValidationErrors = await Promise.all(
            validationJobs.map(async (job) => {
                const eventError = await validateEventConfig(
                    job.eventId,
                    job.fetcherConfigs,
                    job.processConfig,
                );
                return eventError
                    ? {
                          signatureIndex: job.signatureIndex,
                          metricIndex: job.metricIndex,
                          guaranteeName: job.guaranteeName,
                          metricName: job.metricName,
                          eventId: job.eventId,
                          reason: eventError.error,
                          ...(eventError.issues && { issues: eventError.issues }),
                      }
                    : null;
            }),
        );
        signatureErrors.push(...computerValidationErrors.filter((error) => error !== null));

        if (signatureErrors.length > 0) {
            return next(
                new ValidationError('Signature validation failed', {
                    signatureErrors,
                }),
            );
        }
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
    validateSignaturesAgainstAgreementTemplate,
    validateSignatureConfigsInExternalServices,
];
