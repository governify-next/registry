import mongoose, { Schema, Document, Types } from 'mongoose';
export interface IAgreementTemplate extends Document {
    name: string;
    displayName: string;
    description: string;
    orgId: Types.ObjectId;
    isPublic: boolean;
}

const agreementTemplateSchema = new Schema<IAgreementTemplate>({
    name: { type: String, required: true },
    displayName: { type: String },
    description: { type: String },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isPublic: { type: Boolean },
});

agreementTemplateSchema.index({ orgId: 1, name: 1 }, { unique: true });

const AgreementTemplate = mongoose.model<IAgreementTemplate>(
    'AgreementTemplate',
    agreementTemplateSchema,
);
export default AgreementTemplate;
