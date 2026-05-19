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

export interface IAgreementVersionSignatureInput {
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

export interface IAgreementVersionPayload extends IAgreementVersionData {
    signatures: IAgreementVersionSignatureInput[];
}
