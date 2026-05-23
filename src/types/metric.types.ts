export interface IFetcherConfig {
    fetcherId: string;
    fetcherConfig: Record<string, unknown> | null;
}

export interface IMetricConfig {
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

export interface IMetricDefinition {
    metricName: string;
    metricConfig: IMetricConfig;
}

export interface IMetric extends IMetricDefinition {
    value: number | null;
    evidences: Record<string, unknown>[];
}
