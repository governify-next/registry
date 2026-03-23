import GuaranteeTemplate, { IGuaranteeTemplate } from '../models/guaranteeTemplate.model.js';

export const getGuaranteeTemplates = async () => {
    return await GuaranteeTemplate.find();
};

export const getGuaranteeTemplate = async (guaranteeName: string) => {
    return await GuaranteeTemplate.findOne({ name: guaranteeName });
};

export const createGuaranteeTemplate = async (data: Partial<IGuaranteeTemplate>) => {
    const guaranteeTemplate = new GuaranteeTemplate(data);
    return await guaranteeTemplate.save();
};

export const updateGuaranteeTemplate = async (
    guaranteeName: string,
    data: Partial<IGuaranteeTemplate>,
) => {
    return await GuaranteeTemplate.findOneAndUpdate({ name: guaranteeName }, data, { new: true });
};

export const deleteGuaranteeTemplate = async (guaranteeName: string) => {
    return await GuaranteeTemplate.findOneAndDelete({ name: guaranteeName });
};
