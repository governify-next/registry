import Metric from '../models/metric.model.js';

export const findMetricsByName = async (metricsName: string[]) => {
    return await Metric.find({ title: { $in: metricsName } });
};
