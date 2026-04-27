import mongoose, { Schema, Document } from 'mongoose';

// Subdocumentos

const infoSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        example: { type: String },
    },
    { _id: false },
);

const metricSchema = new Schema(
    {
        metricName: { type: String, required: true },
        event: {
            eventId: { type: String, required: true },
            fetcherConfigs: [
                {
                    fetcherId: { type: String, required: true },
                    fetcherConfig: { type: Schema.Types.Mixed, default: null },
                },
            ],
            processConfig: { type: Schema.Types.Mixed, default: null },
        },
        aggregation: {
            aggregatorType: { type: String, required: true },
            aggregatorConfig: { type: Schema.Types.Mixed, default: {} },
        },
    },
    { _id: false },
);

// Interfaz para TypeScript

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

export interface IGuaranteeTemplate extends Document {
    name: string;
    info: {
        title: string;
        description: string;
        example: string;
    };
    numericExpression: string;
    comparator: null;
    threshold: null;
    window: null;
    metrics: IMetric[];
}

// Esquema principal

const guaranteeTemplateSchema = new Schema<IGuaranteeTemplate>({
    name: { type: String, required: true, unique: true },
    info: { type: infoSchema, required: true },
    numericExpression: { type: String, required: true },
    comparator: { type: Schema.Types.Mixed },
    threshold: { type: Schema.Types.Mixed },
    window: { type: Schema.Types.Mixed },
    metrics: { type: [metricSchema], required: true },
});

const GuaranteeTemplate = mongoose.model<IGuaranteeTemplate>(
    'GuaranteeTemplate',
    guaranteeTemplateSchema,
);
export default GuaranteeTemplate;
