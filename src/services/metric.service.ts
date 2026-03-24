import * as metricRepository from '../repositories/metric.repository.js';

export const findMetricsByNames = async (metricsName: string[]) => {
    return await metricRepository.findMetricsByName(metricsName);
};
