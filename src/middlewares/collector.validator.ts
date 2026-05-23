import { type Request, type Response, type NextFunction } from 'express';
import { ExternalServiceError } from '../utils/customErrors.js';
import * as collectorIntegration from '../integrations/collector.integration.js';

export const validateCollectorHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const collectorHealth = await collectorIntegration.checkHealth();
        if (!collectorHealth) {
            return next(new ExternalServiceError('Collector service is not available'));
        }
        next();
    } catch (err) {
        next(err);
    }
};
