import { Types } from 'mongoose';
import Guarantee, { IGuarantee } from '../models/guarantee.model.js';

export const createGuarantees = async (configs: Partial<IGuarantee>[]) => {
    return await Guarantee.insertMany(configs);
};

export const getGuaranteesByAgreementTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await Guarantee.find({ agreementTemplateId });
};

export const deleteGuaranteesByTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await Guarantee.deleteMany({ agreementTemplateId: agreementTemplateId });
};
