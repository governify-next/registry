import { Comparator } from './agreementTemplate.types.js';
import { IMetricDefinition } from './metric.js';
import { IWindow } from './window.js';

export interface IAssembledGuarantee {
    name: string;
    numericExpression: string;
    comparator: Comparator;
    threshold: number;
    window: IWindow;
    metrics: IMetricDefinition[];
}
