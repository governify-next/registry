// Tipo base de dominio independiente de mongoose
export interface IAgreementTemplateData {
    name: string;
    description: string;
    public: boolean;
}

export interface WindowData {
    period: {
        unit: 'milisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';
        value: number;
    }[];
    anchorDate: string;
}

export interface IGuaranteeEntry {
    guaranteeTemplateName: string;
    comparator: string;
    threshold: number;
    window: WindowData;
}

// Payload del POST/PUT: datos de la plantilla
export interface AgreementTemplatePayload extends IAgreementTemplateData {
    guarantees: IGuaranteeEntry[];
}
