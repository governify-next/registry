import { Types } from 'mongoose';
import MetricConfig, { IMetricConfig } from '../models/metricConfig.model.js';

export const createMetricConfigs = async (configs: Partial<IMetricConfig>[]) => {
    return await MetricConfig.insertMany(configs);
};

export const deleteMetricConfigsByTemplateId = async (templateId: Types.ObjectId) => {
    return await MetricConfig.deleteMany({ guaranteeTemplateId: templateId });
};

export const findByTemplateIdAndPopulate = async (templateId: Types.ObjectId) => {
    // Usamos .populate apuntando a la ref metricId y le pedimos sacar solo su propiedad title
    return await MetricConfig.find({ guaranteeTemplateId: templateId }).populate<{
        metricId: { title: string };
    }>('metricId', 'title');
};
