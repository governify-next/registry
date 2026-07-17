import { type Request, type Response, type NextFunction } from 'express';
import { ExternalServiceError } from '../utils/customErrors.js';
import * as fetcherIntegration from '../integrations/fetcher.integration.js';

export const validateFetcherHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fetcherHealth = await fetcherIntegration.checkHealth();
        if (!fetcherHealth) {
            return next(new ExternalServiceError('Fetcher service is not available'));
        }
        next();
    } catch (err) {
        next(err);
    }
};
