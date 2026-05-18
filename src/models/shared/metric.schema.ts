import { Schema } from 'mongoose';

const metricConfigSchema = new Schema(
    {
        event: {
            eventId: { type: String, required: true },
            fetcherConfigs: [
                {
                    fetcherId: { type: String, required: true },
                    fetcherConfig: { type: Schema.Types.Mixed, default: null },
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
        value: { type: Number, default: null },
        evidences: { type: [Schema.Types.Mixed], default: [] },
        metricConfig: { type: metricConfigSchema, required: true },
    },
    { _id: false },
);
