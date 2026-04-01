import mongoose, { Schema, Document, Types } from 'mongoose';

// Subdocuments

const partSchema = new Schema(
    {
        auditConfig: { type: Schema.Types.Mixed, default: {} },
    },
    { _id: true },
);

// TypeScript Interface

export interface IElement extends Document {
    name: string;
    description: string;
    organizationId: Types.ObjectId; // Reference by _id, not name
    fields: Record<string, unknown>[];
    permissions: {
        view: Types.ObjectId[];
        edit: Types.ObjectId[];
        delete: Types.ObjectId[];
        create: Types.ObjectId[];
    };
    auditConfig: Record<string, unknown>;
    parts: {
        _id: Types.ObjectId;
        auditConfig: Record<string, unknown>;
    }[];
}

// Main Schema

const elementSchema = new Schema<IElement>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
        fields: [{ type: Schema.Types.Mixed }],
        permissions: {
            view: { type: [Schema.Types.ObjectId], required: true },
            edit: { type: [Schema.Types.ObjectId], required: true },
            delete: { type: [Schema.Types.ObjectId], required: true },
            create: { type: [Schema.Types.ObjectId], required: true },
        },
        auditConfig: { type: Schema.Types.Mixed, default: {} },
        parts: { type: [partSchema], default: [] },
    },
    {
        timestamps: true, // createdAt and updatedAt
    },
);

// element names must be unique within an organization
elementSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Element = mongoose.model<IElement>('Element', elementSchema);
export default Element;
