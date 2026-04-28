import { Types } from 'mongoose';
import { ISignatureEntry } from '../types/agreementVersion.types.js';
import {
    findGuaranteeTemplateById,
    getGuaranteeTemplateByName,
} from './guaranteeTemplate.service.js';
import { getGuaranteeByTemplateIds, resolveGuaranteeById } from './guarantee.service.js';
import * as signatureRepository from '../repositories/signature.repository.js';
import { IAgreementVersion } from '../models/agreementCollection.model.js';
import { resolveAgreementTemplateById } from './agreementTemplate.service.js';

export const createSignaturesByVersion = async (
    signatures: ISignatureEntry[],
    templateId: Types.ObjectId,
) => {
    const createdSignatures = await Promise.all(
        signatures.map(async (sig) => {
            // Obtenemos el guarantee template id a partir del name
            const guaranteeTemplate = await getGuaranteeTemplateByName(sig.guaranteeName);
            const guaranteeTemplateId = guaranteeTemplate!._id;

            // Obtenemos la guarantee a partir de la guarantee template y el agreement template
            const guarantee = await getGuaranteeByTemplateIds(templateId, guaranteeTemplateId);

            return await signatureRepository.createSignature(guarantee!._id, sig.metrics);
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
            const mergedMetrics = guaranteeTemplate!.metrics.map((templateMetric) => {
                const signatureMetric = sig.metrics.find(
                    (sm) => sm.metricName === templateMetric.metricName,
                );
                return {
                    metricName: templateMetric.metricName,
                    event: {
                        eventId: templateMetric.event.eventId,
                        fetcherConfigs:
                            signatureMetric?.fetcherConfigs ?? templateMetric.event.fetcherConfigs,
                        processConfig:
                            signatureMetric?.processConfig ?? templateMetric.event.processConfig,
                    },
                    aggregation: templateMetric.aggregation,
                };
            });

            return {
                signatureId: sig._id,
                guarantee: {
                    name: guaranteeTemplate!.name,
                    numericExpression: guaranteeTemplate!.numericExpression,
                    comparator: guarantee!.comparator,
                    threshold: guarantee!.threshold,
                    window: guarantee!.window,
                    metrics: mergedMetrics,
                },
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
