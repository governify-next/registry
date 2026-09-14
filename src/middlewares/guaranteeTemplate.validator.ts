import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, DuplicateKeyError, ExternalServiceError } from '../utils/customErrors.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as guaranteeService from '../services/guarantee.service.js';
import { validateEventExists, validateAggregator } from '../integrations/computer.integration.js';
import { validateFetcherExists } from '../integrations/fetcher.integration.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extracts the metric names referenced in a numeric expression.
 * The first character of a metric must be a letter (e.g. MT_ELEMENT_xx_...)
 */
const extractMetricNames = (expression: string): string[] => {
    const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_-]*/g) || [];
    return [...new Set(tokens)];
};

/**
 * Validates that an expression is a valid mathematical formula.
 * Allowed tokens: metric names, numbers (optionally with decimals), the operators +-/* and parentheses.
 *
 * Rules:
 * 1. The expression must be made up of valid tokens only (no stray characters).
 * 2. Two operands (name or number) cannot follow each other without an operator between them.
 * 3. Parentheses must be balanced.
 */
const isValidMathExpression = (expression: string): boolean => {
    // Example: "(MT_A/MT_B)*100"
    const TOKEN_REGEX = /[A-Za-z_][A-Za-z0-9_-]*|\d+(\.\d+)?|[+\-*/()]/g;
    const tokens = expression.match(TOKEN_REGEX);
    //  Splits into: ["(", "MT_A", "/", "MT_B", ")", "*", "100"]

    // Rebuild it to check whether any included element was ignored
    if (!tokens || tokens.join('') !== expression) return false;

    // Walk through each token one by one
    let depth = 0;
    let prev = ''; // previous token
    const isOperand = (t: string) => /^[A-Za-z_\d]/.test(t);
    const isOperator = (t: string) => /^[+\-*/]$/.test(t);

    for (const token of tokens) {
        // The expression cannot start with an operator: +MT_A, *100
        if (isOperator(token) && prev === '') return false;
        // Two operands in a row without an operator: 100MT_A
        if (isOperand(token) && isOperand(prev)) return false;
        // Operand followed by "(": 100(...)
        if (token === '(' && isOperand(prev)) return false;
        // ")" followed by an operand: (...)100
        if (isOperand(token) && prev === ')') return false;
        // Operator right after "(": (*MT_A)
        if (isOperator(token) && prev === '(') return false;
        // ")" right after an operator or "(": (MT_A/) or ()
        if (token === ')' && (isOperator(prev) || prev === '(')) return false;

        if (token === '(') depth++;
        if (token === ')') depth--;
        if (depth < 0) return false;

        prev = token;
    }

    // The expression cannot end with an operator: MT_A+, 100/
    if (isOperator(prev)) return false;

    return depth === 0; // at the very end depth must be 0, otherwise the parentheses were unbalanced
};

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

const nullFieldValidation = (field: string) =>
    body(field)
        .exists({ checkNull: false })
        .withMessage(`${field} is required`)
        .custom((value) => {
            if (value !== null) throw new Error(`${field} must be null`);
            return true;
        });

const infoValidation = [
    body('info')
        .exists({ checkNull: true })
        .withMessage('info is required')
        .isObject()
        .withMessage('info must be an object'),
    body('info.title')
        .exists({ checkNull: true })
        .withMessage('info.title is required')
        .isString()
        .withMessage('info.title must be a string')
        .notEmpty()
        .withMessage('info.title must not be empty')
        .isLength({ min: 3, max: 200 })
        .withMessage('info.title must be between 3 and 200 characters'),
    body('info.description')
        .exists({ checkNull: true })
        .withMessage('info.description is required')
        .isString()
        .withMessage('info.description must be a string')
        .isLength({ max: 500 })
        .withMessage('info.description must be at most 500 characters'),
    body('info.example')
        .exists({ checkNull: true })
        .withMessage('info.example is required')
        .isString()
        .withMessage('info.example must be a string')
        .isLength({ max: 500 })
        .withMessage('info.example must be at most 500 characters'),
];

const numericExpressionValidation = body('numericExpression')
    .exists({ checkNull: true })
    .withMessage('numericExpression is required')
    .isString()
    .withMessage('numericExpression must be a string')
    .notEmpty()
    .withMessage('numericExpression must not be empty')
    .isLength({ max: 500 })
    .withMessage('numericExpression must be at most 500 characters');

const metricsStructureValidation = [
    body('metrics')
        .exists({ checkNull: true })
        .withMessage('metrics is required')
        .isArray({ min: 1 })
        .withMessage('metrics must be an array with at least one entry'),
    body('metrics.*.metricName')
        .exists({ checkNull: true })
        .withMessage('Each metric must have a metricName')
        .isString()
        .withMessage('metricName must be a string')
        .notEmpty()
        .withMessage('metricName must not be empty'),
    body('metrics.*.metricConfig')
        .exists({ checkNull: true })
        .withMessage('Each metric must have a metricConfig')
        .isObject()
        .withMessage('metricConfig must be an object'),
    body('metrics.*.metricConfig.event.eventId')
        .exists({ checkNull: true })
        .withMessage('Each metric must have an event.eventId')
        .isString()
        .withMessage('eventId must be a string')
        .notEmpty()
        .withMessage('eventId must not be empty'),
    body('metrics.*.metricConfig.event.fetcherConfigs')
        .exists({ checkNull: true })
        .withMessage('Each metric must have event.fetcherConfigs')
        .isArray({ min: 1 })
        .withMessage('fetcherConfigs must be an array with at least one entry'),
    body('metrics.*.metricConfig.event.fetcherConfigs.*.fetcherId')
        .exists({ checkNull: true })
        .withMessage('Each fetcherConfig must have a fetcherId')
        .isString()
        .withMessage('fetcherId must be a string')
        .notEmpty()
        .withMessage('fetcherId must not be empty'),
    body('metrics.*.metricConfig.event.fetcherConfigs.*.fetcherConfig')
        .exists({ checkNull: false })
        .withMessage('Each fetcherConfig entry must include fetcherConfig field')
        .custom((value) => {
            if (value !== null) throw new Error('fetcherConfig must be null in guarantee template');
            return true;
        }),
    body('metrics.*.metricConfig.event.processConfig')
        .exists({ checkNull: false })
        .withMessage('Each metric must include event.processConfig field')
        .custom((value) => {
            if (value !== null) throw new Error('processConfig must be null in guarantee template');
            return true;
        }),
    body('metrics.*.metricConfig.aggregation.aggregatorType')
        .exists({ checkNull: true })
        .withMessage('Each metric must have an aggregation.aggregatorType')
        .isString()
        .withMessage('aggregatorType must be a string')
        .notEmpty()
        .withMessage('aggregatorType must not be empty'),
    body('metrics.*.metricConfig.aggregation.aggregatorConfig')
        .exists({ checkNull: true })
        .withMessage('Each metric must have an aggregation.aggregatorConfig')
        .isObject()
        .withMessage('aggregatorConfig must be an object'),
];

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

// ─── Business logic validations ─────────────────────────────────

const uniqueGuaranteeTemplateName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // On update, if the name does not change there is no conflict
        if (req.params.guaranteeName && req.params.guaranteeName === req.body.name) return next();

        const existing = await guaranteeTemplateService.getGuaranteeTemplateByName(req.body.name);
        if (existing)
            return next(
                new DuplicateKeyError(`Guarantee template '${req.body.name}' already exists`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

const noDuplicateMetricNames = (req: Request, res: Response, next: NextFunction) => {
    const names: string[] = req.body.metrics.map((m: { metricName: string }) => m.metricName);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);

    if (duplicates.length > 0)
        return next(
            new ValidationError(
                `Duplicate metric names in metrics: ${[...new Set(duplicates)].join(', ')}`,
            ),
        );
    next();
};

const validNumericExpression = (req: Request, res: Response, next: NextFunction) => {
    const expression: string = req.body.numericExpression;
    const metricNames: string[] = req.body.metrics.map((m: { metricName: string }) => m.metricName);

    // 1. Check that the expression is mathematically valid
    if (!isValidMathExpression(expression))
        return next(
            new ValidationError(
                'numericExpression is not a valid mathematical expression. Allowed: metric names, numbers, and operators +-/*()',
            ),
        );

    // 2. Check consistency between the expression and metricConfigs
    const referencedMetrics = extractMetricNames(expression);

    const unusedMetrics = metricNames.filter((name) => !referencedMetrics.includes(name));
    if (unusedMetrics.length > 0)
        return next(
            new ValidationError(
                `Metrics declared in metricConfigs but not used in numericExpression: ${unusedMetrics.join(', ')}`,
            ),
        );

    const undeclaredMetrics = referencedMetrics.filter((name) => !metricNames.includes(name));
    if (undeclaredMetrics.length > 0)
        return next(
            new ValidationError(
                `Metrics referenced in numericExpression but not declared in metricConfigs: ${undeclaredMetrics.join(', ')}`,
            ),
        );

    next();
};

const validateMetricsInExternalServices = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const errors: string[] = [];

        for (const metric of req.body.metrics) {
            const eventError = await validateEventExists(metric.metricConfig.event.eventId);
            if (eventError) errors.push(eventError);

            for (const fetcherConfig of metric.metricConfig.event.fetcherConfigs) {
                const fetcherError = await validateFetcherExists(fetcherConfig.fetcherId);
                if (fetcherError) errors.push(fetcherError);
            }

            const aggregatorError = await validateAggregator(
                metric.metricConfig.aggregation.aggregatorType,
                metric.metricConfig.aggregation.aggregatorConfig,
            );
            if (aggregatorError) errors.push(aggregatorError);
        }

        if (errors.length > 0)
            return next(new ValidationError(`External validation failed: ${errors.join('; ')}`));
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

export const existingGuaranteeTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const template = await guaranteeTemplateService.getGuaranteeTemplateByName(
            req.params.guaranteeName,
        );
        if (!template)
            return next(
                new ValidationError(`Guarantee template '${req.params.guaranteeName}' not found`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

const guaranteeTemplateNotInUse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const template = await guaranteeTemplateService.getGuaranteeTemplateByName(
            req.params.guaranteeName,
        );
        const inUse = await guaranteeService.isGuaranteeTemplateInUse(template!._id);
        if (inUse)
            return next(
                new ValidationError(
                    `Guarantee template '${req.params.guaranteeName}' is in use by an agreement template and cannot be deleted`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

// ─── Middleware ────────────────────────────────────────────────────

export const validateCreateGuaranteeTemplate = [
    // 1. Field validation
    nameValidation,
    nullFieldValidation('comparator'),
    nullFieldValidation('threshold'),
    nullFieldValidation('window'),
    ...infoValidation,
    numericExpressionValidation,
    ...metricsStructureValidation,
    collectValidationErrors,
    // 2. Logic validation
    uniqueGuaranteeTemplateName,
    noDuplicateMetricNames,
    validNumericExpression,
    validateMetricsInExternalServices,
];

export const validateUpdateGuaranteeTemplate = [
    // 1. Validation of the editable fields
    nameValidation,
    ...infoValidation,
    numericExpressionValidation,
    ...metricsStructureValidation,
    collectValidationErrors,
    // 2. Logic validation
    existingGuaranteeTemplate,
    uniqueGuaranteeTemplateName,
    noDuplicateMetricNames,
    validNumericExpression,
    validateMetricsInExternalServices,
];

export const validateDeleteGuaranteeTemplate = [
    existingGuaranteeTemplate,
    guaranteeTemplateNotInUse,
];
