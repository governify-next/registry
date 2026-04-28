import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, DuplicateKeyError } from '../utils/customErrors.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as guaranteeService from '../services/guarantee.service.js';
import { validateEventExists, validateAggregator } from '../integrations/computer.integration.js';
import { validateFetcherExists } from '../integrations/collector.integration.js';

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
 * Valida que una expresión sea una fórmula matemática válida.
 * Tokens permitidos: nombres de métrica, números (opcionalmente con decimales), operadores +-/* y paréntesis.
 *
 * Reglas:
 * 1. La expresión debe estar compuesta únicamente por tokens válidos (sin caracteres sueltos).
 * 2. Dos operandos (nombre o número) no pueden ir seguidos sin un operador entre ellos.
 * 3. Los paréntesis deben estar balanceados.
 */
const isValidMathExpression = (expression: string): boolean => {
    // Ejemplo: "(MT_A/MT_B)*100"
    const TOKEN_REGEX = /[A-Za-z_][A-Za-z0-9_-]*|\d+(\.\d+)?|[+\-*/()]/g;
    const tokens = expression.match(TOKEN_REGEX);
    //  Rompe en: ["(", "MT_A", "/", "MT_B", ")", "*", "100"]

    // Reconstruimos para ver si se ha ignorado algún elemento incluido
    if (!tokens || tokens.join('') !== expression) return false;

    // Recorremos cada token uno a uno
    let depth = 0;
    let prev = ''; // token anterior
    const isOperand = (t: string) => /^[A-Za-z_\d]/.test(t);
    const isOperator = (t: string) => /^[+\-*/]$/.test(t);

    for (const token of tokens) {
        // La expresión no puede empezar por operador: +MT_A, *100
        if (isOperator(token) && prev === '') return false;
        // Dos operandos seguidos sin operador: 100MT_A
        if (isOperand(token) && isOperand(prev)) return false;
        // Operando seguido de "(": 100(...)
        if (token === '(' && isOperand(prev)) return false;
        // ")" seguido de operando: (...)100
        if (isOperand(token) && prev === ')') return false;
        // Operador justo después de "(": (*MT_A)
        if (isOperator(token) && prev === '(') return false;
        // ")" justo después de operador o "(": (MT_A/) o ()
        if (token === ')' && (isOperator(prev) || prev === '(')) return false;

        if (token === '(') depth++;
        if (token === ')') depth--;
        if (depth < 0) return false;

        prev = token;
    }

    // La expresión no puede terminar en operador: MT_A+, 100/
    if (isOperator(prev)) return false;

    return depth === 0; // al final del todo, debemos tener profundidad 0 o los paréntesis estaban mal balanceados
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
    body('metrics.*.event.eventId')
        .exists({ checkNull: true })
        .withMessage('Each metric must have an event.eventId')
        .isString()
        .withMessage('eventId must be a string')
        .notEmpty()
        .withMessage('eventId must not be empty'),
    body('metrics.*.event.fetcherConfigs')
        .exists({ checkNull: true })
        .withMessage('Each metric must have event.fetcherConfigs')
        .isArray({ min: 1 })
        .withMessage('fetcherConfigs must be an array with at least one entry'),
    body('metrics.*.event.fetcherConfigs.*.fetcherId')
        .exists({ checkNull: true })
        .withMessage('Each fetcherConfig must have a fetcherId')
        .isString()
        .withMessage('fetcherId must be a string')
        .notEmpty()
        .withMessage('fetcherId must not be empty'),
    body('metrics.*.event.fetcherConfigs.*.fetcherConfig')
        .exists({ checkNull: false })
        .withMessage('Each fetcherConfig entry must include fetcherConfig field')
        .custom((value) => {
            if (value !== null) throw new Error('fetcherConfig must be null in guarantee template');
            return true;
        }),
    body('metrics.*.event.processConfig')
        .exists({ checkNull: false })
        .withMessage('Each metric must include event.processConfig field')
        .custom((value) => {
            if (value !== null) throw new Error('processConfig must be null in guarantee template');
            return true;
        }),
    body('metrics.*.aggregation.aggregatorType')
        .exists({ checkNull: true })
        .withMessage('Each metric must have an aggregation.aggregatorType')
        .isString()
        .withMessage('aggregatorType must be a string')
        .notEmpty()
        .withMessage('aggregatorType must not be empty'),
    body('metrics.*.aggregation.aggregatorConfig')
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

// ─── Validaciones de lógica de negocio ─────────────────────────────────

const uniqueGuaranteeTemplateName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Si es update y el nombre no cambia, no hay conflicto
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

    // 1. Comprobamos que la expresión sea válida matemáticamente
    if (!isValidMathExpression(expression))
        return next(
            new ValidationError(
                'numericExpression is not a valid mathematical expression. Allowed: metric names, numbers, and operators +-/*()',
            ),
        );

    // 2. Comprobamos consistencia expresión <-> metricConfigs
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
            const eventError = await validateEventExists(metric.event.eventId);
            if (eventError) errors.push(eventError);

            for (const fetcherConfig of metric.event.fetcherConfigs) {
                const fetcherError = await validateFetcherExists(fetcherConfig.fetcherId);
                if (fetcherError) errors.push(fetcherError);
            }

            const aggregatorError = await validateAggregator(
                metric.aggregation.aggregatorType,
                metric.aggregation.aggregatorConfig,
            );
            if (aggregatorError) errors.push(aggregatorError);
        }

        if (errors.length > 0)
            return next(new ValidationError(`External validation failed: ${errors.join('; ')}`));
        next();
    } catch (err) {
        next(err);
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
    // 1. Validación de campos
    nameValidation,
    nullFieldValidation('comparator'),
    nullFieldValidation('threshold'),
    nullFieldValidation('window'),
    ...infoValidation,
    numericExpressionValidation,
    ...metricsStructureValidation,
    collectValidationErrors,
    // 2. Validación de lógica
    uniqueGuaranteeTemplateName,
    noDuplicateMetricNames,
    validNumericExpression,
    validateMetricsInExternalServices,
];

export const validateUpdateGuaranteeTemplate = [
    // 1. Validación de los campos modificables
    nameValidation,
    ...infoValidation,
    numericExpressionValidation,
    ...metricsStructureValidation,
    collectValidationErrors,
    // 2. Validación de lógica
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
