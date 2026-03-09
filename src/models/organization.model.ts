import mongoose, { Schema, Document } from 'mongoose';

// Subdocumentos (sin _id de mongoose)

const fieldSchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true },
        value: { type: Schema.Types.Mixed }, // acepta cualquier valor
    },
    { _id: false },
);

const roleSchema = new Schema(
    {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
    },
    { _id: false },
);

const userByRoleSchema = new Schema(
    {
        userId: { type: String, required: true },
        rolesId: { type: [String], required: true },
    },
    { _id: false },
);

// Interfaz para TypeScript

export interface IOrganization extends Document {
    id: string;
    name: string;
    description: string;
    elementFields: {
        id: string;
        name: string;
        description: string;
        type: string;
        value?: unknown;
    }[];
    agreementFields: {
        id: string;
        name: string;
        description: string;
        type: string;
        value?: unknown;
    }[];
    roles: {
        id: string;
        name: string;
        description: string;
    }[];
    usersByRole: {
        userId: string;
        rolesId: string[];
    }[];
}

// Esquema principal (_id interno no expuesto en la API, como la versión)

const organizationSchema = new Schema<IOrganization>(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        elementFields: { type: [fieldSchema], default: [] },
        agreementFields: { type: [fieldSchema], default: [] },
        roles: { type: [roleSchema], default: [] },
        usersByRole: { type: [userByRoleSchema], default: [] },
    },
    {
        timestamps: true, // createdAt y updatedAt
        toJSON: {
            transform: (_doc, ret: Record<string, unknown>) => {
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    },
);
const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;
