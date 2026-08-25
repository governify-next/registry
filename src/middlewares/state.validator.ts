import { body, query, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

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
