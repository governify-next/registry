import { Schema } from 'mongoose';
import { MetricStatus } from '../../types/metric.types.js';

const fetchResultSchema = new Schema(
    {
        id: { type: String, required: true },
        status: {
            type: String,
            enum: ['IN_PROGRESS', 'COMPLETED', 'UNAVAILABLE', 'FAILED'],
            required: true,
        },
        unavailableReason: { type: String, default: null },
    },
    { _id: false },
);

const metricConfigSchema = new Schema(
    {
        event: {
            eventId: { type: String, required: true },
            fetcherConfigs: [
                {
                    fetcherId: { type: String, required: true },
                    fetcherConfig: { type: Schema.Types.Mixed, default: null },
                    fetchResult: { type: fetchResultSchema, default: undefined },
                    _id: false,
                },
            ],
            processConfig: { type: Schema.Types.Mixed, default: null },
        },
        aggregation: {
            aggregatorType: { type: String, required: true },
            aggregatorConfig: { type: Schema.Types.Mixed, default: {} },
        },
    },
    { _id: false, minimize: false },
);

export const metricDefinitionSchema = new Schema(
    {
        metricName: { type: String, required: true },
        metricConfig: { type: metricConfigSchema, required: true },
    },
    { _id: false },
);

export const metricSchema = new Schema(
    {
        metricName: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(MetricStatus),
            required: true,
            default: MetricStatus.PENDING,
        },
        value: { type: Number, default: null },
        evidences: { type: [Schema.Types.Mixed], default: [] },
        errorMessage: { type: String, default: null },
        metricConfig: { type: metricConfigSchema, required: true },
    },
    { _id: false },
);
