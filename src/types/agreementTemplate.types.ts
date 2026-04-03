// Tipo base de dominio independiente de mongoose
export interface IAgreementTemplateData {
    name: string;
    displayName: string;
    description: string;
    isPublic: boolean;
}

export interface WindowData {
    period: {
        unit: 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';
        value: number;
    }[];
    anchorDate: string;
}

export type Comparator = '<' | '>' | '<=' | '>=' | '==' | '!=';

export interface IGuaranteeEntry {
    guaranteeTemplateName: string;
    comparator: Comparator;
    threshold: number;
    window: WindowData;
}

// Payload del POST/PUT: datos de la plantilla
export interface AgreementTemplatePayload extends IAgreementTemplateData {
    guarantees: IGuaranteeEntry[];
}
