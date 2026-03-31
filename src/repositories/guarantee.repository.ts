import { Types } from 'mongoose';
import Guarantee, { IGuarantee } from '../models/guarantee.model.js';

export const createGuarantees = async (configs: Partial<IGuarantee>[]) => {
    return await Guarantee.insertMany(configs);
};

export const getGuaranteesByAgreementTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await Guarantee.find({ agreementTemplateId });
};

export const getGuaranteeByTemplateIds = async (
    agreementTemplateId: Types.ObjectId,
    guaranteeTemplateId: Types.ObjectId,
) => {
    return await Guarantee.findOne({
        agreementTemplateId: agreementTemplateId,
        guaranteeTemplateId: guaranteeTemplateId,
    });
};

export const deleteGuaranteesByTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await Guarantee.deleteMany({ agreementTemplateId: agreementTemplateId });
};

export const resolveGuaranteeById = async (guaranteeId: Types.ObjectId) => {
    return await Guarantee.findOne({ _id: guaranteeId });
};
