import { Types } from 'mongoose';
import { ISignatureEntry } from '../types/agreementVersion.types.js';
import {
    findGuaranteeTemplateById,
    findGuaranteeTemplateByName,
} from './guaranteeTemplate.service.js';
import {
    assembleGuarantee,
    getGuaranteeByTemplateIds,
    resolveGuaranteeById,
} from './guarantee.service.js';
import * as signatureRepository from '../repositories/signature.repository.js';
import { IAgreementVersion } from '../models/agreementCollection.model.js';
import { resolveAgreementTemplateById } from './agreementTemplate.service.js';
import { findByTemplateIdAndPopulate } from './metricConfig.service.js';

export const createSignaturesByVersion = async (
    signatures: ISignatureEntry[],
    templateId: Types.ObjectId,
) => {
    const createdSignatures = await Promise.all(
        signatures.map(async (sig) => {
            // Obtenemos el guarantee template id a partir del name
            const guaranteeTemplate = await findGuaranteeTemplateByName(sig.guaranteeName);
            const guaranteeTemplateId = guaranteeTemplate!._id;

            // Obtenemos la guarantee a partir de la guarantee template y el agreement template
            const guarantee = await getGuaranteeByTemplateIds(templateId, guaranteeTemplateId);

            return await signatureRepository.createSignature(guarantee!._id, sig.auditConfig);
        }),
    );

    return createdSignatures;
};

export const getSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await signatureRepository.getSignaturesByIds(signatureIds);
};

export const assembleBySignature = async (agreementVersion: IAgreementVersion) => {
    // Buscamos las signatures de la version por los ids
    const signatureIds = agreementVersion.contract.signaturesId;
    const signatures = await getSignaturesByIds(signatureIds);

    const assembledSignatures = await Promise.all(
        signatures.map(async (sig) => {
            const guarantee = await resolveGuaranteeById(sig.guaranteeId);
            const guaranteeTemplate = await findGuaranteeTemplateById(
                guarantee!.guaranteeTemplateId,
            );
            const metricConfigs = await findByTemplateIdAndPopulate(guaranteeTemplate!._id);
            const mappedMetricConfigs = metricConfigs.map((mc) => ({
                name: mc.metricId.title, // TODO: Mejorar legibilidad
                config: mc.metricConfig,
            }));
            return {
                signatureId: sig._id,
                guarantee: {
                    name: guaranteeTemplate!.name,
                    numericExpression: guaranteeTemplate!.numericExpression,
                    comparator: guarantee!.comparator,
                    threshold: guarantee!.threshold,
                    window: guarantee!.window,
                    metricsConfig: mappedMetricConfigs,
                },
                auditConfig: sig.auditConfig,
            };
        }),
    );

    const agreementTemplate = await resolveAgreementTemplateById(
        agreementVersion.contract.agreementTemplateId,
    );

    return {
        versionNumber: agreementVersion.versionNumber,
        contract: {
            agreementTemplateName: agreementTemplate!.name,
            validity: agreementVersion.contract.validity,
            signatures: assembledSignatures,
        },
    };
};

export const deleteSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await signatureRepository.deleteSignaturesByIds(signatureIds);
};
