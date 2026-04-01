import { Types } from 'mongoose';
import MetricConfig, { IMetricConfig } from '../models/metricConfig.model.js';

export const createMetricConfigs = async (configs: Partial<IMetricConfig>[]) => {
    return await MetricConfig.insertMany(configs);
};

export const deleteMetricConfigsByTemplateId = async (templateId: Types.ObjectId) => {
    return await MetricConfig.deleteMany({ guaranteeTemplateId: templateId });
};

export const findByTemplateId = async (templateId: Types.ObjectId) => {
    return await MetricConfig.find({ guaranteeTemplateId: templateId });
};
