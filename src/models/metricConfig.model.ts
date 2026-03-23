import mongoose, { Schema, Document, Types } from 'mongoose';

// Interfaz para TypeScript

export interface IMetricConfig extends Document {
    guaranteeTemplateId: Types.ObjectId;
    metricId: Types.ObjectId;
    metricConfig: unknown;
}

const metricConfigSchema = new Schema<IMetricConfig>({
    guaranteeTemplateId: { type: Schema.Types.ObjectId, required: true, ref: 'GuaranteeTemplate' },
    metricId: { type: Schema.Types.ObjectId, required: true, ref: 'Metric' },
    metricConfig: { type: Schema.Types.Mixed },
});

// Esquema principal

const MetricConfig = mongoose.model<IMetricConfig>('MetricConfig', metricConfigSchema);
export default MetricConfig;
