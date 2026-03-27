// Tipo base de dominio independiente de mongoose
export interface IGuaranteeTemplateData {
    name: string;
    info: {
        title: string;
        description?: string;
        example?: string;
    };
    numericExpression: string;
    comparator: null;
    threshold: null;
    window: null;
}

export interface IMetricConfigEntry {
    name: string;
    config: Record<string, unknown>;
}

// Payload del POST/PUT: datos de la plantilla (guaranteeTemplate en sí) + configuración de métricas (metricConfigs)
export interface GuaranteeTemplatePayload extends IGuaranteeTemplateData {
    metricsConfig: IMetricConfigEntry[];
}
