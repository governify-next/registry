import { Types } from 'mongoose';
import * as agreementTemplateRepository from '../repositories/agreementTemplate.repository.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';
import * as guaranteeService from '../services/guarantee.service.js';
import { IAgreementTemplate } from '../models/agreementTemplate.model.js';
import { AgreementTemplatePayload, IGuaranteeEntry } from '../types/agreementTemplate.types.js';

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
    guarantees: IGuaranteeEntry[],
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

// TODO: Unificar ambas funciones con un atributo de control
export const getCleanAgreementTemplatesByOrganization = async (orgId: Types.ObjectId) => {
    const templates = await agreementTemplateRepository.getAgreementTemplatesByOrganization(orgId);

    return templates;
};

export const updateAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
    data: AgreementTemplatePayload,
) => {
    const { guarantees, name, description, displayName, isPublic } = data;

    // 1. Actualizamos el agreementTemplate
    const updatedTemplate = await agreementTemplateRepository.updateAgreementTemplate(
        orgId,
        agreementTemplateName,
        { name, description, displayName, isPublic },
    );

    // 2. Hacemos un wipe and replace de las guarantees asociadas al agreement template
    await guaranteeService.deleteGuaranteesByTemplateId(updatedTemplate!._id);

    // 3. Creamos las nuevas guarantees asociadas
    await buildAndSaveGuarantees(updatedTemplate!._id, guarantees);

    // 4. Devolvemos la respuesta construida
    return await assembleAgreementTemplate(updatedTemplate!);
};

export const deleteAgreementTemplateByOrganization = async (
    orgId: Types.ObjectId,
    agreementTemplateName: string,
) => {
    // 1. Buscamos el agreement template
    const template = await agreementTemplateRepository.getAgreementTemplateByOrganization(
        orgId,
        agreementTemplateName,
    );
    // 2. Borramos las garantías que referencian al agreement template
    await guaranteeService.deleteGuaranteesByTemplateId(template!._id);
    // 3. Borramos el agreement template
    return await agreementTemplateRepository.deleteAgreementTemplate(template!._id);
};

export const getPublicAgreementTemplates = async () => {
    const templates = await agreementTemplateRepository.getPublicAgreementTemplates();
    return await Promise.all(templates.map((t) => assembleAgreementTemplate(t)));
};

export const resolveAgreementTemplateById = async (templateId: Types.ObjectId) => {
    return await agreementTemplateRepository.resolveAgreementTemplateById(templateId);
};
