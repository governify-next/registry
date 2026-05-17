export interface IFetcherConfig {
    fetcherId: string;
    fetcherConfig: Record<string, unknown> | null;
}
export interface IMetric {
    metricName: string;
    event: {
        eventId: string;
        fetcherConfigs: IFetcherConfig[];
        processConfig: Record<string, unknown> | null;
    };
    aggregation: {
        aggregatorType: string;
        aggregatorConfig: Record<string, unknown>;
    };
}

export interface IComputedMetric {
    metricName: string;
    value: number | null;
    evidences: Record<string, unknown>[];
    metricConfig: Record<string, unknown>;
}
