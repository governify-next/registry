import { Types } from 'mongoose';
import AgreementCollection, { IAgreementVersion } from '../models/agreementCollection.model.js';

export const createAgreementVersion = async (
    agColId: Types.ObjectId,
    agreementVersion: IAgreementVersion,
) => {
    return await AgreementCollection.findOneAndUpdate(
        { _id: agColId },
        {
            $push: { agreementVersions: agreementVersion },
            $set: { auditableVersionNumber: agreementVersion.versionNumber },
        },
        { new: true },
    );
};

export const updateAgreementVersionEarlyTermination = async (
    agColId: Types.ObjectId,
    versionNumber: number,
    earlyTermination: Date,
) => {
    return await AgreementCollection.findOneAndUpdate(
        {
            _id: agColId,
            agreementVersions: {
                $elemMatch: {
                    versionNumber,
                    'contract.validity.earlyTermination': null,
                },
            },
        },
        {
            $set: {
                'agreementVersions.$.contract.validity.earlyTermination': earlyTermination,
            },
        },
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

export const deleteAgreementVersionByCollection = async (
    agColId: Types.ObjectId,
    versionNumber: number,
    resetAuditable: boolean,
) => {
    return await AgreementCollection.findOneAndUpdate(
        { _id: agColId },
        {
            $pull: { agreementVersions: { versionNumber } },
            ...(resetAuditable && { $set: { auditableVersionNumber: null } }),
        },
        { new: true },
    );
};

export const terminateActiveVersion = async (
    agColId: Types.ObjectId,
    versionNumber: number,
    earlyTermination: Date,
) => {
    return await AgreementCollection.findOneAndUpdate(
        { _id: agColId, 'agreementVersions.versionNumber': versionNumber },
        {
            $set: {
                'agreementVersions.$.contract.validity.earlyTermination': earlyTermination,
                auditableVersionNumber: null,
            },
        },
        { new: true },
    );
};
