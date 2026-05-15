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
    metrics: {
        metricName: string;
        fetcherConfigs: {
            fetcherId: string;
            fetcherConfig: Record<string, unknown>;
        }[];
        processConfig: Record<string, unknown>;
    }[];
}

export interface AgreementVersionPayload extends IAgreementVersionData {
    signatures: ISignatureEntry[];
}
