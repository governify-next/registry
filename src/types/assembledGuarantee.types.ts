import { IMetric } from './metric.js';
import { IWindow } from './window.js';

export interface IAssembledGuarantee {
    name: string;
    numericExpression: string;
    comparator: string;
    threshold: number;
    window: IWindow;
    metrics: IMetric[];
}
