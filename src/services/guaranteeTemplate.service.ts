import { Types } from 'mongoose';
import * as guaranteeTemplateRepository from '../repositories/guaranteeTemplate.repository.js';
import * as metricService from './metric.service.js';
import * as metricConfigService from './metricConfig.service.js';
import { CreateGuaranteePayload } from '../types/guaranteeTemplate.types.js';

export const getGuaranteeTemplate = async (guaranteeName: string) => {
    return await guaranteeTemplateRepository.getGuaranteeTemplate(guaranteeName);
};

export const getGuaranteeTemplates = async () => {
    return await guaranteeTemplateRepository.getGuaranteeTemplates();
};

// Método reutilizable para crear las configuraciones de métricas
const buildAndSaveMetricConfigs = async (
    templateId: Types.ObjectId,
    metricsConfig?: CreateGuaranteePayload['metricsConfig'],
) => {
    if (!metricsConfig || metricsConfig.length === 0) return; // para el update es necesario

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

export const createGuaranteeTemplate = async (data: CreateGuaranteePayload) => {
    // 1. Extraer cada parte del payload
    const { metricsConfig, ...guaranteeData } = data;

    // 2. Crear la guaranteeTemplate
    const newTemplate = await guaranteeTemplateRepository.createGuaranteeTemplate(guaranteeData);

    // 3. Crear las metricsConfigs asociadas
    await buildAndSaveMetricConfigs(newTemplate._id, metricsConfig);

    return newTemplate;
};

export const updateGuaranteeTemplate = async (
    guaranteeName: string,
    data: CreateGuaranteePayload,
) => {
    // 1. Extraer cada parte del payload
    const { metricsConfig, ...guaranteeData } = data;

    // 2. Actualizar guaranteeTemplate
    const updatedTemplate = await guaranteeTemplateRepository.updateGuaranteeTemplate(
        guaranteeName,
        guaranteeData,
    );

    // 3. Reemplazar metricConfig
    if (updatedTemplate && metricsConfig) {
        // Hacemos wipe and replace, borramos toda config de la plantilla y sustituimos por lo nuevo
        await metricConfigService.deleteMetricConfigsByTemplateId(updatedTemplate._id);
        await buildAndSaveMetricConfigs(updatedTemplate._id, metricsConfig);
    }

    return updatedTemplate;
};

export const deleteGuaranteeTemplate = async (guaranteeName: string) => {
    // 1. Obtenemos el template
    const guaranteeTemplate = await getGuaranteeTemplate(guaranteeName);

    // 2. Borramos las metricConfigs asociadas
    await metricConfigService.deleteMetricConfigsByTemplateId(guaranteeTemplate!._id);

    // 3. Borramos el template
    return await guaranteeTemplateRepository.deleteGuaranteeTemplate(guaranteeTemplate!.name);
};
