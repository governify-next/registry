import { Comparator } from './comparator.types.js';
import { IMetricDefinition } from './metric.types.js';
import { IWindow } from './window.types.js';

export interface IAssembledGuarantee {
    name: string;
    numericExpression: string;
    comparator: Comparator;
    threshold: number;
    window: IWindow;
    metrics: IMetricDefinition[];
}
