import { Types } from 'mongoose';
import * as guaranteeTemplateRepository from '../repositories/guaranteeTemplate.repository.js';
import * as metricService from './metric.service.js';
import * as metricConfigService from './metricConfig.service.js';
import { GuaranteeTemplatePayload, MetricConfigEntry } from '../types/guaranteeTemplate.types.js';
import { IGuaranteeTemplate } from '../models/guaranteeTemplate.model.js';

// Método reutilizable para ensamblar el template con sus metricConfigs
const assembleGuaranteeTemplate = async (template: IGuaranteeTemplate) => {
    // 1. Traemos las metricConfigs del template
    const metricConfigs = await metricConfigService.findByTemplateIdAndPopulate(template._id);

    // 2. Montamos el array de respuesta
    const mappedMetricConfigs = metricConfigs.map((mc) => ({
        name: mc.metricId.title,
        config: mc.metricConfig,
    }));
    // 3. Devolvemos la plantilla (el toObject permite añadir campos a la nueva instancia)
    return {
        ...template.toObject(),
        metricsConfig: mappedMetricConfigs,
    };
};

// Método reutilizable para crear las configuraciones de métricas
const buildAndSaveMetricConfigs = async (
    templateId: Types.ObjectId,
    metricsConfig: MetricConfigEntry[],
) => {
    const metricNames = metricsConfig.map((m) => m.name);
    const metricsFromDb = await metricService.findMetricsByNames(metricNames);

    const configToSave = metricsConfig.map((mConf) => {
        const dbMetric = metricsFromDb.find((m) => m.title === mConf.name);

        return {
            guaranteeTemplateId: templateId,
            metricId: dbMetric!._id,
            metricConfig: mConf.config,
        };
    });

    await metricConfigService.createMetricConfigs(configToSave);
};

export const getGuaranteeTemplate = async (guaranteeName: string) => {
    const template = await guaranteeTemplateRepository.getGuaranteeTemplate(guaranteeName);
    return await assembleGuaranteeTemplate(template!);
};

export const getGuaranteeTemplates = async () => {
    const templates = await guaranteeTemplateRepository.getGuaranteeTemplates();
    // Usamos Promise.all para resolver en paralelo
    return await Promise.all(templates.map((t) => assembleGuaranteeTemplate(t)));
};

export const createGuaranteeTemplate = async (data: GuaranteeTemplatePayload) => {
    // 1. Extraer cada parte del payload
    const { metricsConfig, ...guaranteeData } = data;

    // 2. Crear la guaranteeTemplate
    const newTemplate = await guaranteeTemplateRepository.createGuaranteeTemplate(guaranteeData);

    // 3. Crear las metricsConfigs asociadas
    await buildAndSaveMetricConfigs(newTemplate._id, metricsConfig);

    return await getGuaranteeTemplate(guaranteeData.name);
};

export const updateGuaranteeTemplate = async (
    guaranteeName: string,
    data: GuaranteeTemplatePayload,
) => {
    // 1. Extraer cada parte del payload
    const { metricsConfig, ...guaranteeData } = data;

    // 2. Actualizar guaranteeTemplate
    const updatedTemplate = await guaranteeTemplateRepository.updateGuaranteeTemplate(
        guaranteeName,
        guaranteeData,
    );

    // 3. Hacemos un wipe and replace de metricConfigs
    await metricConfigService.deleteMetricConfigsByTemplateId(updatedTemplate!._id);
    await buildAndSaveMetricConfigs(updatedTemplate!._id, metricsConfig);

    return await getGuaranteeTemplate(guaranteeName);
};

export const deleteGuaranteeTemplate = async (guaranteeName: string) => {
    // 1. Obtenemos el template
    const template = await guaranteeTemplateRepository.getGuaranteeTemplate(guaranteeName);
    // 2. Borramos las metricConfigs asociadas
    await metricConfigService.deleteMetricConfigsByTemplateId(template!._id);
    // 3. Borramos el template
    return await guaranteeTemplateRepository.deleteGuaranteeTemplate(guaranteeName);
};
