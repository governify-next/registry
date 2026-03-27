import { Types } from 'mongoose';
import AgreementTemplate from '../models/agreementTemplate.model.js';
import { AgreementTemplateData } from '../types/agreementTemplate.types.js';

export const createAgreementTemplate = async (
    orgId: Types.ObjectId,
    data: AgreementTemplateData,
) => {
    const agreementTemplate = new AgreementTemplate({
        ...data,
        orgId,
    });
    return await agreementTemplate.save();
};

export const getAgreementTemplate = async (agreementTemplateName: string) => {
    return await AgreementTemplate.findOne({ name: agreementTemplateName });
};
