import { IMetricConfig } from '../models/metricConfig.model.js';
import * as metricConfigRepository from '../repositories/metricConfig.repository.js';

export const createMetricConfigs = async (configs: Partial<IMetricConfig>[]) => {
    return await metricConfigRepository.createMetricConfigs(configs);
};
