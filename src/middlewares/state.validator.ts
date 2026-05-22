import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

const startDateValidation = body('startDate')
    .exists({ checkNull: true })
    .withMessage('startDate is required')
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date');

const endDateValidation = body('endDate')
    .exists({ checkNull: true })
    .withMessage('endDate is required')
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date');

const endDateAfterOrEqualStartDate = (req: Request, res: Response, next: NextFunction) => {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate < startDate) {
        return next(new ValidationError('endDate must be after or equal to startDate'));
    }

    next();
};

export const validateGenerateConsolidatedStatesBody = [
    startDateValidation,
    endDateValidation,
    collectValidationErrors,
    endDateAfterOrEqualStartDate,
];
