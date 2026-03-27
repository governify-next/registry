// Tipo base de dominio independiente de mongoose
export interface AgreementTemplateData {
    name: string;
    description: string;
}

export interface WindowData {
    period: {
        unit: 'milisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';
        value: number;
    }[];
    anchorDate: string;
}

export interface GuaranteeEntry {
    guaranteeTemplateName: string;
    comparator: string;
    threshold: number;
    window: WindowData;
}

// Payload del POST/PUT: datos de la plantilla
export interface AgreementTemplatePayload extends AgreementTemplateData {
    guarantees: GuaranteeEntry[];
}
