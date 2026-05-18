import { IMetric } from '../types/metric.js';

export const evaluateNumericExpression = (
    expression: string,
    metrics: IMetric[],
): number | null => {
    const metricValues: Record<string, number> = {};
    for (const metric of metrics) {
        metricValues[metric.metricName] = metric.value!;
    }
    const func = new Function(...Object.keys(metricValues), `return ${expression};`);
    const result = func(...Object.values(metricValues));

    if (result === null || result === undefined || !isFinite(result)) {
        return null;
    }

    return result;
};

export const evaluateCompliance = (
    expressionValue: number,
    comparator: string,
    threshold: number,
): boolean | null => {
    switch (comparator) {
        case '>':
            return expressionValue > threshold;
        case '>=':
            return expressionValue >= threshold;
        case '<':
            return expressionValue < threshold;
        case '<=':
            return expressionValue <= threshold;
        case '==':
            return expressionValue === threshold;
        case '!=':
            return expressionValue !== threshold;
        default:
            return null;
    }
};

export const replaceExpressionWithValues = (expression: string, metrics: IMetric[]): string => {
    let replacedExpression = expression;
    for (const metric of metrics) {
        const regex = new RegExp(`\\b${metric.metricName}\\b`, 'g');
        replacedExpression = replacedExpression.replace(regex, metric.value!.toString());
    }
    return replacedExpression;
};
