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

export const createGuaranteeTemplate = async (data: CreateGuaranteePayload) => {
    // 1. Extraer cada parte del payload
    const { metricsConfig, ...guaranteeData } = data;
    // 2. Crear la guaranteeTemplate
    const newTemplate = await guaranteeTemplateRepository.createGuaranteeTemplate(guaranteeData);
    // 3. Obtenemos el id de las métricas
    const metricNames = metricsConfig.map((m) => m.name);
    const metricsFromDb = await metricService.findMetricsByNames(metricNames);
    // 4. Convertimos el payload
    const configToSave = metricsConfig.map((mConf) => {
        const dbMetric = metricsFromDb.find((m) => m.title === mConf.name);

        return {
            guaranteeTemplateId: newTemplate._id,
            metricId: dbMetric!._id,
            metricConfig: mConf.config,
        };
    });
    // 5. Crear las metricsConfigs
    await metricConfigService.createMetricConfigs(configToSave);

    return newTemplate;
};
