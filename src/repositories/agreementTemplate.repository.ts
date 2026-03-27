import { Types } from 'mongoose';
import AgreementTemplate from '../models/agreementTemplate.model.js';
import { IAgreementTemplateData } from '../types/agreementTemplate.types.js';

export const createAgreementTemplate = async (
    orgId: Types.ObjectId,
    data: IAgreementTemplateData,
) => {
    const agreementTemplate = new AgreementTemplate({
        ...data,
        orgId,
    });
    return await agreementTemplate.save();
};

export const getAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
) => {
    return await AgreementTemplate.findOne({ orgId: orgId, name: agreementTemplateName });
};

export const getAgreementTemplatesByOrganization = async (orgId: Types.ObjectId) => {
    return await AgreementTemplate.find({ orgId: orgId });
};

export const updateAgreementTemplate = async (
    agreementTemplateName: string,
    data: Partial<IAgreementTemplateData>,
) => {
    return await AgreementTemplate.findOneAndUpdate({ name: agreementTemplateName }, data, {
        new: true,
    });
};

export const deleteAgreementTemplate = async (agreementTemplateId: Types.ObjectId) => {
    return await AgreementTemplate.findOneAndDelete({ _id: agreementTemplateId });
};

export const getPublicAgreementTemplates = async () => {
    return await AgreementTemplate.find({ public: true });
};
