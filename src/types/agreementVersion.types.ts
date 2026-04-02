import { Types } from 'mongoose';
import { ISignature } from '../models/signature.model.js';

export interface IAgreementVersionData {
    contract: {
        agreementTemplateName: string;
        validity: {
            timezone: string;
            initial: Date;
            end: Date;
            earlyTermination: Date;
        };
    };
}

export interface ISignatureEntry {
    guaranteeName: string;
    auditConfig: Record<string, unknown>;
}

export interface AgreementVersionPayload extends IAgreementVersionData {
    signatures: ISignatureEntry[];
}
