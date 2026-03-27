import mongoose, { Schema, Document, Types } from 'mongoose';

// Interfaz para TypeScript

export interface IAgreementTemplate extends Document {
    name: string;
    description: string;
    orgId: Types.ObjectId;
}

// Esquema principal

const agreementTemplateSchema = new Schema<IAgreementTemplate>({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
});

const AgreementTemplate = mongoose.model<IAgreementTemplate>(
    'AgreementTemplate',
    agreementTemplateSchema,
);
export default AgreementTemplate;
