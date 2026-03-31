import { Types } from 'mongoose';
import AgreementCollection, { IAgreementVersion } from '../models/agreementCollection.model.js';

export const createAgreementVersion = async (
    agColId: Types.ObjectId,
    agreementVersion: IAgreementVersion,
) => {
    return await AgreementCollection.findOneAndUpdate(
        { _id: agColId },
        { $push: { agreementVersions: agreementVersion } },
        { new: true },
    );
};

export const updateSignaturesId = async (
    agColId: Types.ObjectId,
    versionNumber: number,
    signaturesId: Types.ObjectId[],
) => {
    return await AgreementCollection.findOneAndUpdate(
        { _id: agColId, 'agreementVersions.versionNumber': versionNumber },
        { $set: { 'agreementVersions.$.contract.signaturesId': signaturesId } },
        { new: true },
    );
};

export const deleteAuditableVersionByCollection = async (
    agColId: Types.ObjectId,
    versionNumber: number,
) => {
    return await AgreementCollection.findOneAndUpdate(
        {
            _id: agColId,
        },
        { $pull: { agreementVersions: { versionNumber } } },
        { new: true },
    );
};

export const terminateActiveVersion = async (agColId: Types.ObjectId, versionNumber: number) => {
    return await AgreementCollection.findOneAndUpdate(
        { _id: agColId, 'agreementVersions.versionNumber': versionNumber },
        {
            $set: {
                'agreementVersions.$.contract.validity.earlyTermination': new Date(),
                auditableVersionNumber: null,
            },
        },
        { new: true },
    );
};
