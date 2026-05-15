import { Types } from 'mongoose';
import Signature, { ISignature } from '../models/signature.model.js';

export const createSignature = async (
    guaranteeId: Types.ObjectId,
    metrics: ISignature['metrics'],
) => {
    return await Signature.create({ guaranteeId, metrics });
};

export const getSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await Signature.find({ _id: { $in: signatureIds } });
};

export const deleteSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await Signature.deleteMany({ _id: signatureIds });
};
