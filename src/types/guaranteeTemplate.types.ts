// Tipo base de dominio independiente de mongoose
export interface GuaranteeTemplateData {
    name: string;
    multiPart: boolean;
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

export interface MetricConfigEntry {
    name: string;
    config: Record<string, unknown>;
}

// Payload del POST/PUT: datos de la plantilla (guaranteeTemplate en sí) + configuración de métricas (metricConfigs)
export interface GuaranteeTemplatePayload extends GuaranteeTemplateData {
    metricsConfig: MetricConfigEntry[];
}
