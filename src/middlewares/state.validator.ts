import { body, validationResult } from 'express-validator';
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
    collectValidationErrors,
    endDateAfterOrEqualStartDate,
];
