import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMembership extends Document {
    organizationId: Types.ObjectId;
    userId: Types.ObjectId;
    rolesId: Types.ObjectId[];
}

const membershipSchema = new Schema<IMembership>(
    {
        organizationId: { type: Schema.Types.ObjectId, required: true, ref: 'Organization' },
        userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
        rolesId: {
            type: [Schema.Types.ObjectId],
            default: [],
        },
    },
    { timestamps: true },
);

// Índice de unicidad
membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

// Índice para saber que usuarios tienen x roles en una org
membershipSchema.index({ organizationId: 1, rolesId: 1 });

const Membership = mongoose.model<IMembership>('Membership', membershipSchema);
export default Membership;
