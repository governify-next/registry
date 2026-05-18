import mongoose, { Schema, Document, Types } from 'mongoose';
import { Comparator } from '../types/agreementTemplate.types.js';
import { IWindow } from '../types/window.js';
import { windowSchema } from './shared/window.schema.js';

export interface IGuarantee extends Document {
    guaranteeTemplateId: Types.ObjectId;
    agreementTemplateId: Types.ObjectId;
    comparator: Comparator;
    threshold: number;
    window: IWindow;
}

// Esquema principal

const guaranteeSchema = new Schema<IGuarantee>({
    guaranteeTemplateId: { type: Schema.ObjectId, required: true },
    agreementTemplateId: { type: Schema.ObjectId, required: true },
    comparator: { type: String, required: true, enum: ['<', '>', '<=', '>=', '==', '!='] },
    threshold: { type: Number, required: true },
    window: { type: windowSchema, required: true },
});

// No se pueden crear diferentes garantías para un guarantee template en un agreement template
guaranteeSchema.index({ agreementTemplateId: 1, guaranteeTemplateId: 1 }, { unique: true });

const Guarantee = mongoose.model<IGuarantee>('Guarantee', guaranteeSchema);
export default Guarantee;
