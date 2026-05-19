import { IWindowPeriod } from './window.js';

// Tipo base de dominio independiente de mongoose
export interface IAgreementTemplateData {
    name: string;
    displayName: string;
    description: string;
    isPublic: boolean;
}

export const comparators = ['<', '>', '<=', '>=', '==', '!='] as const;

export type Comparator = (typeof comparators)[number];

export interface IGuaranteeEntry {
    guaranteeTemplateName: string;
    comparator: Comparator;
    threshold: number;
    window: {
        period: IWindowPeriod[];
        anchorDate: string;
    };
}

// Payload del POST/PUT: datos de la plantilla
export interface AgreementTemplatePayload extends IAgreementTemplateData {
    guarantees: IGuaranteeEntry[];
}
