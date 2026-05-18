import mongoose, { Schema, Document } from 'mongoose';
import { IMetricDefinition } from '../types/metric.js';
import { metricDefinitionSchema } from './shared/metric.schema.js';

// Subdocumentos

const infoSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        example: { type: String },
    },
    { _id: false },
);

// Interfaz para TypeScript

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
    metrics: IMetricDefinition[];
}

// Esquema principal

const guaranteeTemplateSchema = new Schema<IGuaranteeTemplate>({
    name: { type: String, required: true, unique: true },
    info: { type: infoSchema, required: true },
    numericExpression: { type: String, required: true },
    comparator: { type: Schema.Types.Mixed },
    threshold: { type: Schema.Types.Mixed },
    window: { type: Schema.Types.Mixed },
    metrics: { type: [metricDefinitionSchema], required: true },
});

const GuaranteeTemplate = mongoose.model<IGuaranteeTemplate>(
    'GuaranteeTemplate',
    guaranteeTemplateSchema,
);
export default GuaranteeTemplate;
