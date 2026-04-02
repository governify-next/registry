import { Types } from 'mongoose';
import { IMetricConfig } from '../models/metricConfig.model.js';
import * as metricConfigRepository from '../repositories/metricConfig.repository.js';

export const createMetricConfigs = async (configs: Partial<IMetricConfig>[]) => {
    return await metricConfigRepository.createMetricConfigs(configs);
};

export const deleteMetricConfigsByTemplateId = async (templateId: Types.ObjectId) => {
    return await metricConfigRepository.deleteMetricConfigsByTemplateId(templateId);
};

export const findByTemplateId = async (templateId: Types.ObjectId) => {
    return await metricConfigRepository.findByTemplateId(templateId);
};
