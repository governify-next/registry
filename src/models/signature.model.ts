import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISignature extends Document {
    guaranteeId: Types.ObjectId;
    auditConfig: Record<string, unknown>;
}

const signatureSchema = new Schema<ISignature>({
    guaranteeId: { type: Schema.Types.ObjectId, required: true },
    auditConfig: { type: Schema.Types.Mixed, required: true },
});

const Signature = mongoose.model<ISignature>('Signature', signatureSchema);
export default Signature;
