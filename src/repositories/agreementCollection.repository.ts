import { Types } from 'mongoose';
import AgreementCollection, { IAgreementCollection } from '../models/agreementCollection.model.js';

export const getAgreementCollectionsByElement = async (elementId: Types.ObjectId) => {
    return await AgreementCollection.find({ elementId: elementId });
};

export const createAgreementCollectionByElement = async (
    data: Partial<IAgreementCollection>,
    elementId: Types.ObjectId,
) => {
    return await AgreementCollection.create({ ...data, elementId: elementId });
};

export const getAgreementCollectionByElement = async (
    elementId: Types.ObjectId,
    agColName: string,
) => {
    return await AgreementCollection.findOne({ name: agColName, elementId: elementId });
};

export const updateAgreementCollectionByElement = async (
    agColId: Types.ObjectId,
    data: Partial<IAgreementCollection>,
) => {
    return await AgreementCollection.findOneAndUpdate({ _id: agColId }, data, { new: true });
};

export const deleteAgreementCollectionByElement = async (agColId: Types.ObjectId) => {
    return await AgreementCollection.findOneAndDelete({ _id: agColId });
};
