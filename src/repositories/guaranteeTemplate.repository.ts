import GuaranteeTemplate from '../models/guaranteeTemplate.model.js';
import { IGuaranteeTemplateData } from '../types/guaranteeTemplate.types.js';
import { Types } from 'mongoose';

export const getGuaranteeTemplates = async () => {
    return await GuaranteeTemplate.find();
};

export const getGuaranteeTemplate = async (guaranteeName: string) => {
    return await GuaranteeTemplate.findOne({ name: guaranteeName });
};

export const findGuaranteeTemplatesByNames = async (guaranteeTemplatesNames: string[]) => {
    return await GuaranteeTemplate.find({ name: { $in: guaranteeTemplatesNames } });
};

export const getGuaranteeTemplateById = async (guaranteeTemplateId: Types.ObjectId) => {
    return await GuaranteeTemplate.findById(guaranteeTemplateId);
};

export const createGuaranteeTemplate = async (data: IGuaranteeTemplateData) => {
    const guaranteeTemplate = new GuaranteeTemplate(data);
    return await guaranteeTemplate.save();
};

export const updateGuaranteeTemplate = async (
    guaranteeName: string,
    data: Partial<IGuaranteeTemplateData>,
) => {
    return await GuaranteeTemplate.findOneAndUpdate({ name: guaranteeName }, data, { new: true });
};

export const deleteGuaranteeTemplate = async (guaranteeName: string) => {
    return await GuaranteeTemplate.findOneAndDelete({ name: guaranteeName });
};
