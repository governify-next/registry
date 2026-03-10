import mongoose, { Schema, Document } from 'mongoose';

// Subdocumentos

const fieldSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true },
        value: { type: Schema.Types.Mixed }, // acepta cualquier valor
    },
    { _id: false },
);

const roleSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
    },
    { _id: false },
);

const userByRoleSchema = new Schema(
    {
        userName: { type: String, required: true },
        rolesName: { type: [String], required: true },
    },
    { _id: false },
);

// Interfaz para TypeScript

export interface IOrganization extends Document {
    name: string;
    description: string;
    elementFields: {
        name: string;
        description: string;
        type: string;
        value?: unknown;
    }[];
    agreementFields: {
        name: string;
        description: string;
        type: string;
        value?: unknown;
    }[];
    roles: {
        name: string;
        description: string;
    }[];
    usersByRole: {
        userName: string;
        rolesName: string[];
    }[];
}

// Esquema principal

const organizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        elementFields: { type: [fieldSchema], default: [] },
        agreementFields: { type: [fieldSchema], default: [] },
        roles: { type: [roleSchema], default: [] },
        usersByRole: { type: [userByRoleSchema], default: [] },
    },
    {
        timestamps: true, // createdAt y updatedAt
    },
);

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;
