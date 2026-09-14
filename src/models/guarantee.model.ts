import mongoose, { Schema, Document, Types } from 'mongoose';
import { Comparator, comparators } from '../types/comparator.types.js';
import { IWindow } from '../types/window.types.js';
import { windowSchema } from './shared/window.schema.js';

export interface IGuarantee extends Document {
    guaranteeTemplateId: Types.ObjectId;
    agreementTemplateId: Types.ObjectId;
    comparator: Comparator;
    threshold: number;
    window: IWindow;
}

const guaranteeSchema = new Schema<IGuarantee>({
    guaranteeTemplateId: { type: Schema.ObjectId, required: true },
    agreementTemplateId: { type: Schema.ObjectId, required: true },
    comparator: { type: String, required: true, enum: comparators },
    threshold: { type: Number, required: true },
    window: { type: windowSchema, required: true },
});

// Different guarantees cannot be created for the same guarantee template within an agreement template
guaranteeSchema.index({ agreementTemplateId: 1, guaranteeTemplateId: 1 }, { unique: true });

const Guarantee = mongoose.model<IGuarantee>('Guarantee', guaranteeSchema);
export default Guarantee;
