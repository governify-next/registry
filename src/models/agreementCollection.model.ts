import mongoose, { Schema, Document, Types } from 'mongoose';

// Interfaz para TypeScript

export interface IAgreementVersion {
    versionNumber: number;
    contract: {
        agreementTemplateId: Types.ObjectId;
        validity: {
            timezone: string;
            initial: Date;
            end: Date;
            earlyTermination: Date;
        };
        signaturesId: Types.ObjectId[];
    };
}

export interface IAgreementCollection extends Document {
    name: string;
    displayName: string;
    elementId: Types.ObjectId;
    auditableVersionNumber: number;
    fields: Record<string, unknown>;
    permissions: Record<string, unknown>;
    agreementVersions: IAgreementVersion[];
}

const agreementVersionSchema = new Schema(
    {
        versionNumber: { type: Number },
        contract: {
            agreementTemplateId: {
                type: Schema.Types.ObjectId,
                ref: 'AgreementTemplate',
                required: true,
            },
            validity: {
                timezone: { type: String },
                initial: { type: Date },
                end: { type: Date },
                earlyTermination: { type: Date, default: null },
            },
            signaturesId: { type: [Schema.Types.ObjectId], ref: 'Signature' },
        },
    },
    { _id: false, timestamps: true },
);

const agreementCollectionSchema = new Schema<IAgreementCollection>(
    {
        name: { type: String },
        displayName: { type: String },
        elementId: { type: Schema.Types.ObjectId, ref: 'Element', required: true },
        auditableVersionNumber: { type: Number, default: null },
        fields: { type: Schema.Types.Mixed, required: true },
        permissions: { type: Schema.Types.Mixed, required: true },
        agreementVersions: { type: [agreementVersionSchema], default: [] },
    },
    {
        timestamps: true, // createdAt y updatedAt
    },
);

const AgreementCollection = mongoose.model<IAgreementCollection>(
    'AgreementCollection',
    agreementCollectionSchema,
);
export default AgreementCollection;
