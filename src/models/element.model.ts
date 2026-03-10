import mongoose, { Schema, Document, Types } from 'mongoose';

// Subdocuments

const partSchema = new Schema({
    auditConfig: { type: Schema.Types.Mixed, default: {} },
});

const permissionsSchema = new Schema(
    {
        view: { type: [String], default: [] },
        edit: { type: [String], default: [] },
        delete: { type: [String], default: [] },
        create: { type: [String], default: [] },
        notify: { type: [String], default: [] },
    },
    { _id: false, strict: false }, // allow additional permission types
);

// TypeScript Interface

export interface IElement extends Document {
    name: string;
    description: string;
    organizationId: Types.ObjectId; // Reference by _id, not name
    fields: Record<string, unknown>;
    permissions: {
        view?: string[];
        edit?: string[];
        delete?: string[];
        create?: string[];
        notify?: string[];
        [key: string]: string[] | undefined; // allow additional permission types
    };
    auditConfig: Record<string, unknown>;
    parts: {
        auditConfig: Record<string, unknown>;
    }[];
}

// Main Schema

const elementSchema = new Schema<IElement>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
        fields: { type: Schema.Types.Mixed, default: {} },
        permissions: { type: permissionsSchema, default: {} },
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
