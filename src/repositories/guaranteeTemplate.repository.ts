import GuaranteeTemplate from '../models/guaranteeTemplate.model.js';
import { GuaranteeTemplateData } from '../types/guaranteeTemplate.types.js';

export const getGuaranteeTemplates = async () => {
    return await GuaranteeTemplate.find();
};

export const getGuaranteeTemplate = async (guaranteeName: string) => {
    return await GuaranteeTemplate.findOne({ name: guaranteeName });
};

export const createGuaranteeTemplate = async (data: GuaranteeTemplateData) => {
    const guaranteeTemplate = new GuaranteeTemplate(data);
    return await guaranteeTemplate.save();
};

export const updateGuaranteeTemplate = async (
    guaranteeName: string,
    data: Partial<GuaranteeTemplateData>,
) => {
    return await GuaranteeTemplate.findOneAndUpdate({ name: guaranteeName }, data, { new: true });
};

export const deleteGuaranteeTemplate = async (guaranteeName: string) => {
    return await GuaranteeTemplate.findOneAndDelete({ name: guaranteeName });
};
