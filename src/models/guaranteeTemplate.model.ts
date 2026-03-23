import mongoose, { Schema, Document } from 'mongoose';

// Subdocumentos

const unitPeriodSchema = new Schema(
    {
        unit: {
            type: String,
            required: true,
            enum: ['milisecond', 'second', 'minute', 'hour', 'day', 'week'],
        },
        value: {
            type: Number,
            required: true,
        },
    },
    { _id: false },
);

const infoSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        example: { type: String },
    },
    { _id: false },
);

const windowSchema = new Schema(
    {
        period: { type: [unitPeriodSchema], required: true },
        anchorDate: { type: Date, required: true }, // TODO: necesario el required true para el anchorDate?
    },
    { _id: false },
);

// Interfaz para TypeScript

export interface IGuaranteeTemplate extends Document {
    name: string;
    multiPart: boolean;
    info: {
        title: string;
        description: string;
        example: string;
    };
    numericExpression: string;
    comparator: string | null;
    threshold: number | null;
    window: {
        period: {
            unit: string;
            value: number;
        }[];
        anchorDate: Date;
    };
}

// Esquema principal

const guaranteeTemplateSchema = new Schema<IGuaranteeTemplate>({
    name: { type: String, required: true, unique: true },
    multiPart: { type: Boolean, required: true },
    info: { type: infoSchema, required: true },
    numericExpression: { type: String, required: true },
    comparator: { type: String },
    threshold: { type: Number },
    window: { type: windowSchema, required: true },
});

const GuaranteeTemplate = mongoose.model<IGuaranteeTemplate>(
    'GuaranteeTemplate',
    guaranteeTemplateSchema,
);
export default GuaranteeTemplate;
