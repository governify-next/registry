import { Types } from 'mongoose';
import { IGuarantee } from '../models/guarantee.model.js';
import * as guaranteeRepository from '../repositories/guarantee.repository.js';

export const createGuarantees = async (configs: Partial<IGuarantee>[]) => {
    return await guaranteeRepository.createGuarantees(configs);
};

export const getGuaranteesByAgreementTemplateId = async (agreementTemplateId: Types.ObjectId) => {
    return await guaranteeRepository.getGuaranteesByAgreementTemplateId(agreementTemplateId);
};
