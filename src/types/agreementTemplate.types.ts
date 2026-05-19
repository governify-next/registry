import { IWindowPeriod } from './window.js';
import { Comparator } from './comparator.js';

export interface IAgreementTemplateData {
    name: string;
    displayName: string;
    description: string;
    isPublic: boolean;
}

export interface IAgreementTemplateGuaranteeInput {
    guaranteeTemplateName: string;
    comparator: Comparator;
    threshold: number;
    window: {
        period: IWindowPeriod[];
        anchorDate: string;
    };
}

export interface IAgreementTemplatePayload extends IAgreementTemplateData {
    guarantees: IAgreementTemplateGuaranteeInput[];
}
