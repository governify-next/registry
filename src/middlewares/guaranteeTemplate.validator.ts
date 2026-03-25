import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, DuplicateKeyError } from '../utils/customErrors.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as metricService from '../services/metric.service.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extrae los nombres de métrica referenciados en una expresión numérica.
 * El primer caracter de las métricas debe empezar por una letra (ej: MT_ELEMENT_xx_...)
 */
const extractMetricNames = (expression: string): string[] => {
    const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_-]*/g) || [];
    return [...new Set(tokens)];
};

/**
 * Valida que una expresión numérica sea parseable como fórmula matemática.
 * Permite: nombres de métrica, números, operadores +-/*() y punto decimal.
 */
const isValidMathExpression = (expression: string): boolean => {
    const allowedCharsRegex = /^[A-Za-z0-9_+\-*/().]+$/;
    if (!allowedCharsRegex.test(expression)) return false;

    // Paréntesis balanceados (el resultado final siempre debe ser 0)
    let depth = 0;
    for (const char of expression) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (depth < 0) return false;
    }
    if (depth !== 0) return false;

    // Sustituimos nombres de métrica por 1 y evaluamos que sea computable
    const testExpression = expression.replace(/[A-Za-z_][A-Za-z0-9_-]*/g, '1');
    try {
        const result = new Function(`return (${testExpression})`)();
        return typeof result === 'number' && isFinite(result);
    } catch {
        return false;
    }
};

// ─── Validaciones de campo ────────────────────────────

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

const multiPartValidation = body('multiPart')
    .exists({ checkNull: true })
    .withMessage('multiPart is required')
    .isBoolean({ strict: true })
    .withMessage('multiPart must be a boolean');

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

const metricsConfigStructureValidation = [
    body('metricsConfig')
        .exists({ checkNull: true })
        .withMessage('metricsConfig is required')
        .isArray({ min: 1 })
        .withMessage('metricsConfig must be an array with at least one entry'),
    body('metricsConfig.*.name')
        .exists({ checkNull: true })
        .withMessage('Each metricsConfig entry must have a name')
        .isString()
        .withMessage('metricsConfig[].name must be a string')
        .notEmpty()
        .withMessage('metricsConfig[].name must not be empty')
        .isLength({ min: 3, max: 100 })
        .withMessage('metricsConfig[].name must be between 3 and 100 characters'),
    body('metricsConfig.*.config')
        .exists({ checkNull: true })
        .withMessage('Each metricsConfig entry must have a config')
        .isObject()
        .withMessage('metricsConfig[].config must be an object'),
];

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

// ─── Validaciones de lógica de negocio ─────────────────────────────────

const uniqueGuaranteeName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existing = await guaranteeTemplateService.findGuaranteeTemplateByName(req.body.name);
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
    const names: string[] = req.body.metricsConfig.map((m: { name: string }) => m.name);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);

    if (duplicates.length > 0)
        return next(
            new ValidationError(
                `Duplicate metric names in metricsConfig: ${[...new Set(duplicates)].join(', ')}`,
            ),
        );
    next();
};

const metricsExistInDb = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metricNames: string[] = req.body.metricsConfig.map((m: { name: string }) => m.name);
        const metricsFromDb = await metricService.findMetricsByNames(metricNames);
        const foundNames = metricsFromDb.map((m) => m.title);
        const missing = metricNames.filter((name) => !foundNames.includes(name));

        if (missing.length > 0)
            return next(
                new ValidationError(`Metrics not found in database: ${missing.join(', ')}`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

const validNumericExpression = (req: Request, res: Response, next: NextFunction) => {
    const expression: string = req.body.numericExpression;
    const metricNames: string[] = req.body.metricsConfig.map((m: { name: string }) => m.name);

    // 1. Comprobamos que la expresión sea válida matemáticamente
    if (!isValidMathExpression(expression))
        return next(
            new ValidationError(
                'numericExpression is not a valid mathematical expression. Allowed: metric names, numbers, and operators +-/*()',
            ),
        );

    // 2. Comprobamos consistencia expresión <-> metricsConfig
    const referencedMetrics = extractMetricNames(expression);

    const unusedMetrics = metricNames.filter((name) => !referencedMetrics.includes(name));
    if (unusedMetrics.length > 0)
        return next(
            new ValidationError(
                `Metrics declared in metricsConfig but not used in numericExpression: ${unusedMetrics.join(', ')}`,
            ),
        );

    const undeclaredMetrics = referencedMetrics.filter((name) => !metricNames.includes(name));
    if (undeclaredMetrics.length > 0)
        return next(
            new ValidationError(
                `Metrics referenced in numericExpression but not declared in metricsConfig: ${undeclaredMetrics.join(', ')}`,
            ),
        );

    next();
};

export const existingGuaranteeTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const template = await guaranteeTemplateService.findGuaranteeTemplateByName(
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

const uniqueGuaranteeNameOnUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Si el nombre no cambia, no hay conflicto
        if (req.body.name === req.params.guaranteeName) return next();

        const existing = await guaranteeTemplateService.findGuaranteeTemplateByName(req.body.name);
        if (existing)
            return next(
                new DuplicateKeyError(`Guarantee template '${req.body.name}' already exists`),
            );
        next();
    } catch (err) {
        next(err);
    }
};

// ─── Middleware ────────────────────────────────────────────────────

export const validateCreateGuaranteeTemplate = [
    // 1. Validación de campos
    nameValidation,
    multiPartValidation,
    nullFieldValidation('comparator'),
    nullFieldValidation('threshold'),
    nullFieldValidation('window'),
    ...infoValidation,
    numericExpressionValidation,
    ...metricsConfigStructureValidation,
    collectValidationErrors,
    // 2. Validación de lógica
    uniqueGuaranteeName,
    noDuplicateMetricNames,
    metricsExistInDb,
    validNumericExpression,
];

export const validateUpdateGuaranteeTemplate = [
    // 1. Validación de los campos modificables
    nameValidation,
    multiPartValidation,
    ...infoValidation,
    numericExpressionValidation,
    ...metricsConfigStructureValidation,
    collectValidationErrors,
    // 2. Validación de lógica
    existingGuaranteeTemplate,
    uniqueGuaranteeNameOnUpdate,
    noDuplicateMetricNames,
    metricsExistInDb,
    validNumericExpression,
];
