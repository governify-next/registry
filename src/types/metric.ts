export interface IMetric {
    metricName: string;
    event: {
        eventId: string;
        fetcherConfigs: {
            fetcherId: string;
            fetcherConfig: Record<string, unknown> | null;
        }[];
        processConfig: Record<string, unknown> | null;
    };
    aggregation: {
        aggregatorType: string;
        aggregatorConfig: Record<string, unknown>;
    };
}

export interface IComputedMetric {
    metricName: string;
    value: number;
    evidences: Record<string, unknown>[];
    metricConfig: Record<string, unknown>;
}
