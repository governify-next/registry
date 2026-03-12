import mongoose, { Schema, Document, Types } from 'mongoose';

// Subdocumentos

const fieldSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, required: true },
        value: {
            type: Schema.Types.Mixed, // acepta cualquier valor
            required: function () {
                return this.type === 'enum';
            },
            validate: {
                // 2a puerta de seguridad para value
                validator: function (value: unknown) {
                    if (this.type === 'enum') {
                        if (value === undefined || !Array.isArray(value)) {
                            return false;
                        }
                    } else {
                        if (value !== undefined) {
                            return false;
                        }
                    }
                    return true;
                },
                message: 'El campo value solo debe existir y ser una lista si el tipo es enum',
            },
        },
    },
    { _id: false },
);

const roleSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        assignedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
    roleAssignments: {
        name: string;
        description: string;
        assignedUsers: Types.ObjectId[];
    }[];
    users: Types.ObjectId[];
}

// Esquema principal

const organizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        elementFields: { type: [fieldSchema], default: [] },
        agreementFields: { type: [fieldSchema], default: [] },
        roleAssignments: { type: [roleSchema], default: [] },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    {
        timestamps: true, // createdAt y updatedAt
    },
);

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);
export default Organization;
