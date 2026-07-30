import { Types } from 'mongoose';
import AgreementCollection, { IAgreementCollection } from '../models/agreementCollection.model.js';

export const getAgreementCollectionById = async (agColId: Types.ObjectId) => {
    return await AgreementCollection.findById(agColId);
};

export const getAgreementCollectionsByScope = async (scopeId: Types.ObjectId) => {
    return await AgreementCollection.find({ scopeId: scopeId });
};

export const getAgreementCollectionsByScopeIds = async (scopeIds: string[]) => {
    return await AgreementCollection.find({ scopeId: { $in: scopeIds } });
};

export const createAgreementCollectionByScope = async (
    data: Partial<IAgreementCollection>,
    scopeId: Types.ObjectId,
) => {
    return await AgreementCollection.create({ ...data, scopeId: scopeId });
};

export const getAgreementCollectionByScope = async (scopeId: Types.ObjectId, agColName: string) => {
    return await AgreementCollection.findOne({ name: agColName, scopeId: scopeId });
};

export const updateAgreementCollectionByScope = async (
    agColId: Types.ObjectId,
    data: Partial<IAgreementCollection>,
) => {
    return await AgreementCollection.findOneAndUpdate({ _id: agColId }, data, { new: true });
};

export const deleteAgreementCollectionByScope = async (agColId: Types.ObjectId) => {
    return await AgreementCollection.findOneAndDelete({ _id: agColId });
};
