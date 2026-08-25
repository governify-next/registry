import { Types } from 'mongoose';
import { IAgreementVersionSignatureInput } from '../types/agreementVersion.types.js';
import {
    findGuaranteeTemplateById,
    getGuaranteeTemplateByName,
} from './guaranteeTemplate.service.js';
import { getGuaranteeByTemplateIds, resolveGuaranteeById } from './guarantee.service.js';
import * as signatureRepository from '../repositories/signature.repository.js';
import { IAgreementVersion } from '../models/agreementCollection.model.js';
import { resolveAgreementTemplateById } from './agreementTemplate.service.js';
import { ValidationError } from '../utils/customErrors.js';

export const createSignaturesByVersion = async (
    signatures: IAgreementVersionSignatureInput[],
    templateId: Types.ObjectId,
) => {
    const createdSignatures = await Promise.all(
        signatures.map(async (sig) => {
            // Get the guarantee template id from the name
            const guaranteeTemplate = await getGuaranteeTemplateByName(sig.guaranteeName);
            const guaranteeTemplateId = guaranteeTemplate!._id;

            // Get the guarantee from the guarantee template and the agreement template
            const guarantee = await getGuaranteeByTemplateIds(templateId, guaranteeTemplateId);

            return await signatureRepository.createSignature(guarantee!._id, sig.metrics);
        }),
    );

    return createdSignatures;
};

export const getSignaturesByIds = async (signatureIds: Types.ObjectId[]) => {
    return await signatureRepository.getSignaturesByIds(signatureIds);
};

export const assembleBySignature = async (
    agreementVersion: IAgreementVersion,
    requestedSignatureIds?: string[],
) => {
    const agreementSignatureIds = agreementVersion.contract.signaturesId;
    let signatureIds = agreementSignatureIds;

    if (requestedSignatureIds !== undefined) {
        const availableSignatureIds = new Set(
            agreementSignatureIds.map((signatureId) => signatureId.toString().toLowerCase()),
        );
        const unknownSignatureIds = requestedSignatureIds.filter(
            (signatureId) => !availableSignatureIds.has(signatureId.toLowerCase()),
        );

        if (unknownSignatureIds.length > 0) {
            throw new ValidationError(
                'Some signatureIds do not belong to the selected agreement version',
                { unknownSignatureIds },
            );
        }

        const requestedSignatureIdSet = new Set(
            requestedSignatureIds.map((signatureId) => signatureId.toLowerCase()),
        );
        signatureIds = agreementSignatureIds.filter((signatureId) =>
            requestedSignatureIdSet.has(signatureId.toString().toLowerCase()),
        );
    }

    const unorderedSignatures = await getSignaturesByIds(signatureIds);
    const signaturesById = new Map(
        unorderedSignatures.map((signature) => [signature._id.toString(), signature]),
    );
    const signatures = signatureIds
        .map((signatureId) => signaturesById.get(signatureId.toString()))
        .filter((signature) => signature !== undefined);

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
                    metricConfig: {
                        event: {
                            eventId: templateMetric.metricConfig.event.eventId,
                            fetcherConfigs:
                                signatureMetric?.fetcherConfigs ??
                                templateMetric.metricConfig.event.fetcherConfigs,
                            processConfig: signatureMetric?.processConfig ?? {},
                        },
                        aggregation: templateMetric.metricConfig.aggregation,
                    },
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
