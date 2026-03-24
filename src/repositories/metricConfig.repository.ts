import MetricConfig, { IMetricConfig } from '../models/metricConfig.model.js';

export const createMetricConfigs = async (configs: Partial<IMetricConfig>[]) => {
    return await MetricConfig.insertMany(configs);
};
