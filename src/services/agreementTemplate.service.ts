import { Types } from 'mongoose';
import * as agreementTemplateRepository from '../repositories/agreementTemplate.repository.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as guaranteeService from '../services/guarantee.service.js';
import { IAgreementTemplate } from '../models/agreementTemplate.model.js';
import {
    IAgreementTemplateGuaranteeInput,
    IAgreementTemplatePayload,
} from '../types/agreementTemplate.types.js';

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
    data: IAgreementTemplatePayload,
) => {
    // 1. Extract each part of the payload
    const { guarantees, ...agreementData } = data;

    // 2. Create the agreement template
    const newTemplate = await agreementTemplateRepository.createAgreementTemplate(
        orgId,
        agreementData,
    );

    // 3. Create the associated guarantees
    await buildAndSaveGuarantees(newTemplate._id, guarantees);

    return await assembleAgreementTemplate(newTemplate);
};

export const buildAndSaveGuarantees = async (
    templateId: Types.ObjectId,
    guarantees: IAgreementTemplateGuaranteeInput[],
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
                anchorDate: new Date(g.window.anchorDate),
            },
        };
    });

    await guaranteeService.createGuarantees(configToSave);
};

export const getAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
) => {
    const template = await agreementTemplateRepository.getAgreementTemplateByOrganization(
        orgId,
        agreementTemplateName,
    );

    return await assembleAgreementTemplate(template!);
};

export const getCleanAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
) => {
    const template = await agreementTemplateRepository.getAgreementTemplateByOrganization(
        orgId,
        agreementTemplateName,
    );

    return template;
};

export const getAgreementTemplatesByOrganization = async (orgId: Types.ObjectId) => {
    const templates = await agreementTemplateRepository.getAgreementTemplatesByOrganization(orgId);

    return await Promise.all(templates.map((t) => assembleAgreementTemplate(t)));
};

// TODO: unified both functions with a control attribute
export const getCleanAgreementTemplatesByOrganization = async (orgId: Types.ObjectId) => {
    const templates = await agreementTemplateRepository.getAgreementTemplatesByOrganization(orgId);

    return templates;
};

export const updateAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
    data: IAgreementTemplatePayload,
) => {
    const { guarantees, name, description, displayName, isPublic } = data;

    // 1. Update the agreement template
    const updatedTemplate = await agreementTemplateRepository.updateAgreementTemplate(
        orgId,
        agreementTemplateName,
        { name, description, displayName, isPublic },
    );

    // 2. Make a wipe and replace of the associated guarantees to the agreement template
    await guaranteeService.deleteGuaranteesByTemplateId(updatedTemplate!._id);

    // 3. Create the new associated guarantees
    await buildAndSaveGuarantees(updatedTemplate!._id, guarantees);

    // 4. Return the built response
    return await assembleAgreementTemplate(updatedTemplate!);
};

export const deleteAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
) => {
    // 1. Get the agreement template
    const template = await agreementTemplateRepository.getAgreementTemplateByOrganization(
        orgId,
        agreementTemplateName,
    );
    // 2. Delete the associated guarantees
    await guaranteeService.deleteGuaranteesByTemplateId(template!._id);
    // 3. Delete the agreement template
    return await agreementTemplateRepository.deleteAgreementTemplate(template!._id);
};

export const getPublicAgreementTemplates = async () => {
    const templates = await agreementTemplateRepository.getPublicAgreementTemplates();
    return await Promise.all(templates.map((t) => assembleAgreementTemplate(t)));
};

export const resolveAgreementTemplateById = async (templateId: Types.ObjectId) => {
    return await agreementTemplateRepository.resolveAgreementTemplateById(templateId);
};
