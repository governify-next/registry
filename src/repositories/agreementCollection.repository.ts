import { Types } from 'mongoose';
import AgreementCollection, { IAgreementCollection } from '../models/agreementCollection.model.js';

export const getAgreementCollectionById = async (agColId: string) => {
    return await AgreementCollection.findById(agColId);
};

export const getAgreementCollectionsByScope = async (scopeId: Types.ObjectId) => {
    return await AgreementCollection.find({ scopeId: scopeId });
};

export const getAgreementCollectionsByScopeIds = async (scopeIds: string[]) => {
    return await AgreementCollection.find({ scopeId: { $in: scopeIds } });
};

export const countAgreementCollectionsByScopeIds = async (scopeIds: string[]) => {
    return await AgreementCollection.aggregate<{ scopeId: Types.ObjectId; collections: number }>([
        { $match: { scopeId: { $in: scopeIds.map((scopeId) => new Types.ObjectId(scopeId)) } } },
        { $group: { _id: '$scopeId', collections: { $sum: 1 } } },
        { $project: { _id: 0, scopeId: '$_id', collections: 1 } },
    ]);
};

export const createAgreementCollectionByScope = async (
    data: Partial<IAgreementCollection>,
    scopeId: Types.ObjectId,
) => {
    return await AgreementCollection.create({ ...data, scopeId: scopeId });
};

export const getAgreementCollectionByScope = async (scopeId: Types.ObjectId, agColId: string) => {
    return await AgreementCollection.findOne({ _id: agColId, scopeId: scopeId });
};

export const getAgreementCollectionByScopeAndName = async (
    scopeId: Types.ObjectId,
    agColName: string,
) => {
    return await AgreementCollection.findOne({ scopeId: scopeId, name: agColName });
};

export const updateAgreementCollectionByScope = async (
    agColId: string,
    data: Partial<IAgreementCollection>,
) => {
    return await AgreementCollection.findOneAndUpdate({ _id: agColId }, data, { new: true });
};

export const deleteAgreementCollectionByScope = async (agColId: string) => {
    return await AgreementCollection.findOneAndDelete({ _id: agColId });
};
