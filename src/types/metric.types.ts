export interface IFetcherConfig {
    fetcherId: string;
    fetcherConfig: Record<string, unknown> | null;
    fetchResult?: {
        id: string;
        status: 'IN_PROGRESS' | 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
        unavailableReason: string | null;
    };
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

export enum MetricStatus {
    PENDING = 'PENDING',
    COMPUTED = 'COMPUTED',
    UNAVAILABLE = 'UNAVAILABLE',
    FAILED = 'FAILED',
}

export interface IMetric extends IMetricDefinition {
    status: MetricStatus;
    value: number | null;
    evidences: Record<string, unknown>[];
    errorMessage: string | null;
}
