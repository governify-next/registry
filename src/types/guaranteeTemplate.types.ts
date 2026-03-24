import { IGuaranteeTemplate } from '../models/guaranteeTemplate.model.js';

// Payload que recibimos del POST para crear una guaranteeTemplate junto con la metricConfig
// Si una template debe referenciar a al menos una métrica, una template debe tener configurada
// al menos una metricConfig
export interface CreateGuaranteePayload extends Partial<IGuaranteeTemplate> {
    metricsConfig: Array<{
        name: string;
        config: Record<string, unknown>;
    }>;
}
