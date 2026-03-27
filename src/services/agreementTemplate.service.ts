import { Types } from 'mongoose';
import * as agreementTemplateRepository from '../repositories/agreementTemplate.repository.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as guaranteeService from '../services/guarantee.service.js';
import { IAgreementTemplate } from '../models/agreementTemplate.model.js';
import { AgreementTemplatePayload, GuaranteeEntry } from '../types/agreementTemplate.types.js';

const assembleAgreementTemplate = async (agreementTemplate: IAgreementTemplate) => {
    const guarantees = await guaranteeService.getGuaranteesByAgreementTemplateId(
        agreementTemplate._id,
    );

    const mappedGuarantees = await Promise.all(
        guarantees.map((g) => guaranteeService.assembleGuarantee(g)),
    );

    return {
        ...agreementTemplate.toObject(),
        guarantees: mappedGuarantees,
    };
};

export const createAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    data: AgreementTemplatePayload,
) => {
    // 1. Extraemos cada parte del payload
    const { guarantees, ...agreementData } = data;

    // 2. Creamos la agreementTemplate
    const newTemplate = await agreementTemplateRepository.createAgreementTemplate(
        orgId,
        agreementData,
    );

    // 3. Creamos las guarantees asociadas
    await buildAndSaveGuarantees(newTemplate._id, guarantees);

    return await assembleAgreementTemplate(newTemplate);
};

export const buildAndSaveGuarantees = async (
    templateId: Types.ObjectId,
    guarantees: GuaranteeEntry[],
) => {
    const guaranteeTemplatesNames = guarantees.map((g) => g.guaranteeTemplateName);
    const guaranteeTemplatesFromDb =
        await guaranteeTemplateService.findGuaranteeTemplatesByName(guaranteeTemplatesNames);

    const configToSave = guarantees.map((g) => {
        const dbGuaranteeTemplate = guaranteeTemplatesFromDb.find(
            (dbTemplate) => dbTemplate.name === g.guaranteeTemplateName,
        );

        return {
            agreementTemplateId: templateId,
            guaranteeTemplateId: dbGuaranteeTemplate!._id,
            comparator: g.comparator,
            threshold: g.threshold,
            window: {
                ...g.window,
                anchorDate: new Date(g.window.anchorDate), // convertimos string enviado a Date
            },
        };
    });

    await guaranteeService.createGuarantees(configToSave);
};
