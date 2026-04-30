import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISignature extends Document {
    guaranteeId: Types.ObjectId;
    metrics: {
        metricName: string;
        fetcherConfigs: {
            fetcherId: string;
            fetcherConfig: Record<string, unknown>;
        }[];
        processConfig: Record<string, unknown>;
    }[];
}

const signatureSchema = new Schema<ISignature>({
    guaranteeId: { type: Schema.Types.ObjectId, required: true },
    metrics: [
        {
            metricName: { type: String, required: true },
            fetcherConfigs: [
                {
                    fetcherId: { type: String, required: true },
                    fetcherConfig: { type: Schema.Types.Mixed, required: true },
                    _id: false,
                },
            ],
            processConfig: { type: Schema.Types.Mixed, required: true },
            _id: false,
        },
    ],
});

const Signature = mongoose.model<ISignature>('Signature', signatureSchema);
export default Signature;
