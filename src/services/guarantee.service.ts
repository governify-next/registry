import { Types } from 'mongoose';
import { IGuarantee } from '../models/guarantee.model.js';
import * as guaranteeRepository from '../repositories/guarantee.repository.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';

export const resolveGuaranteeById = async (guaranteeId: Types.ObjectId) => {
    return await guaranteeRepository.resolveGuaranteeById(guaranteeId);
};

export const assembleGuarantee = async (guarantee: IGuarantee) => {
    const guaranteeTemplate = await guaranteeTemplateService.findGuaranteeTemplateById(
        guarantee.guaranteeTemplateId,
    );

    return {
        guaranteeTemplateName: guaranteeTemplate!.name,
        comparator: guarantee.comparator,
        threshold: guarantee.threshold,
        window: guarantee.window,
    };
};
export const createGuarantees = async (configs: Partial<IGuarantee>[]) => {
    return await guaranteeRepository.createGuarantees(configs);
};

export const getGuaranteesByAgreementTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await guaranteeRepository.getGuaranteesByAgreementTemplateId(agreementTemplateId);
};

export const deleteGuaranteesByTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await guaranteeRepository.deleteGuaranteesByTemplateId(agreementTemplateId);
};

export const getGuaranteeByTemplateIds = async (
    agreementTemplateId: Types.ObjectId,
    guaranteeTemplateId: Types.ObjectId,
) => {
    return await guaranteeRepository.getGuaranteeByTemplateIds(
        agreementTemplateId,
        guaranteeTemplateId,
    );
};
