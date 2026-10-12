import { body, param, query, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';
import * as agreementVersionService from '../services/agreementVersion.service.js';
import * as stateService from '../services/state.service.js';

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

const dateValidation = body('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date');

const requiredDateValidation = body('date')
    .exists({ checkNull: true })
    .withMessage('date is required')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date');

const temporalModeValidation = body('temporalMode')
    .exists({ checkNull: true })
    .withMessage('temporalMode is required')
    .bail()
    .isIn(['CAPTURE', 'REPLAY'])
    .withMessage('temporalMode must be CAPTURE or REPLAY');

const existingStatePolicyValidation = body('ifExists')
    .exists({ checkNull: true })
    .withMessage('ifExists is required')
    .bail()
    .isIn(['KEEP', 'REPLACE'])
    .withMessage('ifExists must be KEEP or REPLACE');

const signatureIdsValidation = [
    body('signatureIds')
        .optional()
        .isArray({ min: 1 })
        .withMessage('signatureIds must be a non-empty array'),
    body('signatureIds.*')
        .isMongoId()
        .withMessage('Every signatureIds entry must be a valid MongoDB ObjectId'),
    body('signatureIds')
        .optional()
        .custom((signatureIds: unknown) => {
            if (!Array.isArray(signatureIds)) return true;
            const normalizedIds = signatureIds.map((id) => String(id).toLowerCase());
            if (new Set(normalizedIds).size !== normalizedIds.length) {
                throw new Error('signatureIds must not contain duplicates');
            }
            return true;
        }),
];

const enabledQueryValidation = query('enabled')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('enabled must be true or false');

const startDateValidation = body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date');

const endDateValidation = body('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date');

const dateOrRangeValidation = body().custom((value: unknown) => {
    const payload =
        value !== null && typeof value === 'object'
            ? (value as Record<string, unknown>)
            : ({} as Record<string, unknown>);
    const hasDate = payload.date !== undefined && payload.date !== null;
    const hasStartDate = payload.startDate !== undefined && payload.startDate !== null;
    const hasEndDate = payload.endDate !== undefined && payload.endDate !== null;

    if (hasDate && (hasStartDate || hasEndDate)) {
        throw new Error('date cannot be combined with startDate or endDate');
    }

    if (!hasDate && (!hasStartDate || !hasEndDate)) {
        throw new Error('Either date or both startDate and endDate are required');
    }

    return true;
});

const endDateAfterOrEqualStartDate = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.date !== undefined) {
        return next();
    }

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate < startDate) {
        return next(new ValidationError('endDate must be after or equal to startDate'));
    }

    next();
};

export const validateGenerateConsolidatedStatesBody = [
    dateValidation,
    startDateValidation,
    endDateValidation,
    dateOrRangeValidation,
    temporalModeValidation,
    existingStatePolicyValidation,
    ...signatureIdsValidation,
    collectValidationErrors,
    endDateAfterOrEqualStartDate,
];

export const validateGenerateStatesBody = [
    requiredDateValidation,
    temporalModeValidation,
    existingStatePolicyValidation,
    ...signatureIdsValidation,
    collectValidationErrors,
];

export const validateCreateConsolidationStateTasksRequest = [
    enabledQueryValidation,
    ...signatureIdsValidation,
    collectValidationErrors,
];

export const validateSearchStatesBody = [
    body().custom((value: unknown) => {
        if (value === undefined) return true;
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Search filters must be a JSON object');
        }
        const unknownFields = Object.keys(value).filter(
            (field) => !['updatedFrom', 'updatedTo'].includes(field),
        );
        if (unknownFields.length > 0) {
            throw new Error(`Unknown State search filters: ${unknownFields.join(', ')}`);
        }
        return true;
    }),
    ...['updatedFrom', 'updatedTo'].map((field) =>
        body(field)
            .optional()
            .isString()
            .bail()
            .isISO8601({ strict: true })
            .withMessage(`${field} must be a valid ISO 8601 date`)
            .bail()
            .custom((value: string) => Number.isFinite(Date.parse(value)))
            .withMessage(`${field} must be a valid date`),
    ),
    body('updatedTo')
        .optional()
        .custom((value: string, { req }) => {
            const from = req.body?.updatedFrom;
            if (typeof from === 'string' && Date.parse(value) < Date.parse(from)) {
                throw new Error('updatedTo must be after or equal to updatedFrom');
            }
            return true;
        }),
    collectValidationErrors,
];

const stateIdValidation = param('stateId')
    .isMongoId()
    .withMessage('stateId must be a valid MongoDB ObjectId');

const stateInAgreementVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orgName, scopeId, agColId, agreementVersion, stateId } = req.params;
        const [collection, state] = await Promise.all([
            agreementCollectionService.getCleanAgreementCollectionByScope(
                orgName,
                scopeId,
                agColId,
            ),
            stateService.getStateById(stateId),
        ]);
        const { contract } = agreementVersionService.resolveAgreementVersionSelector(
            collection!,
            agreementVersion,
        );

        if (!state || !contract.signaturesId.some((id) => id.equals(state.signatureId)))
            return next(
                new NotFoundError(`State '${stateId}' not found in this agreement version`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const validateGetStateForAgreementVersion = [
    stateIdValidation,
    collectValidationErrors,
    stateInAgreementVersion,
];

// Evolutive endpoints share the consolidated date/range, policy and task contracts.
export const validateGenerateEvolutiveStatesBody = validateGenerateConsolidatedStatesBody;
export const validateCreateEvolutiveStateTasksRequest =
    validateCreateConsolidationStateTasksRequest;
