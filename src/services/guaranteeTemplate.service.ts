import { Types } from 'mongoose';
import * as guaranteeTemplateRepository from '../repositories/guaranteeTemplate.repository.js';
import { IGuaranteeTemplate } from '../models/guaranteeTemplate.model.js';

export const findGuaranteeTemplatesByName = async (guaranteeTemplatesNames: string[]) => {
    return await guaranteeTemplateRepository.findGuaranteeTemplatesByNames(guaranteeTemplatesNames);
};

export const findGuaranteeTemplateById = async (guaranteeTemplateId: Types.ObjectId) => {
    return await guaranteeTemplateRepository.getGuaranteeTemplateById(guaranteeTemplateId);
};

export const getGuaranteeTemplateByName = async (guaranteeName: string) => {
    return await guaranteeTemplateRepository.getGuaranteeTemplate(guaranteeName);
};

export const getGuaranteeTemplates = async () => {
    return await guaranteeTemplateRepository.getGuaranteeTemplates();
};

export const createGuaranteeTemplate = async (data: IGuaranteeTemplate) => {
    return await guaranteeTemplateRepository.createGuaranteeTemplate(data);
};

export const updateGuaranteeTemplate = async (
    guaranteeName: string,
    data: Partial<IGuaranteeTemplate>,
) => {
    const { metrics, name, info, numericExpression } = data;

    return await guaranteeTemplateRepository.updateGuaranteeTemplate(guaranteeName, {
        name,
        info,
        numericExpression,
        metrics,
    });
};

export const deleteGuaranteeTemplate = async (guaranteeName: string) => {
    return await guaranteeTemplateRepository.deleteGuaranteeTemplate(guaranteeName);
};
