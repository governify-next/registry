import mongoose, { Schema, Document, Types } from 'mongoose';

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

const windowSchema = new Schema(
    {
        period: { type: [unitPeriodSchema], required: true },
        anchorDate: { type: Date, required: true },
    },
    { _id: false },
);

export interface IGuarantee extends Document {
    guaranteeTemplateId: Types.ObjectId;
    agreementTemplateId: Types.ObjectId;
    comparator: string;
    threshold: number;
    window: {
        period: {
            unit: string;
            value: number;
        }[];
        anchorDate: Date;
    };
}

// Esquema principal

const guaranteeSchema = new Schema<IGuarantee>({
    guaranteeTemplateId: { type: Schema.ObjectId, required: true, unique: true },
    agreementTemplateId: { type: Schema.ObjectId, required: true },
    comparator: { type: String, required: true },
    threshold: { type: Number, required: true },
    window: { type: windowSchema, required: true },
});

const Guarantee = mongoose.model<IGuarantee>('Guarantee', guaranteeSchema);
export default Guarantee;
