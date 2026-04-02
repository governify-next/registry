import { Types } from 'mongoose';
import Signature from '../models/signature.model.js';

export const createSignature = async (
    guaranteeId: Types.ObjectId,
    auditConfig: Record<string, unknown>,
) => {
    return await Signature.create({ guaranteeId, auditConfig });
};

export const getSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await Signature.find({ _id: { $in: signatureIds } });
};

export const deleteSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await Signature.deleteMany({ _id: signatureIds });
};
