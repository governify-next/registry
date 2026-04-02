import mongoose, { Schema, Document, Types } from 'mongoose';

// Interfaz para TypeScript

export interface IMetricConfig extends Document {
    guaranteeTemplateId: Types.ObjectId;
    metricName: string;
    metricConfig: Record<string, unknown>;
}

const metricConfigSchema = new Schema<IMetricConfig>(
    {
        guaranteeTemplateId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'GuaranteeTemplate',
        },
        metricName: { type: String, required: true },
        metricConfig: { type: Schema.Types.Mixed },
    },
    { minimize: false }, // para que no guarde el config vacío por defecto
);

// Esquema principal

const MetricConfig = mongoose.model<IMetricConfig>('MetricConfig', metricConfigSchema);
export default MetricConfig;
