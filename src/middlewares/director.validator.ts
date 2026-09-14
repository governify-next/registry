import { type Request, type Response, type NextFunction } from 'express';
import { ExternalServiceError } from '../utils/customErrors.js';
import * as directorIntegration from '../integrations/director.integration.js';

export const validateDirectorHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const directorHealth = await directorIntegration.checkHealth();
        if (!directorHealth) {
            return next(new ExternalServiceError('Director service is not available'));
        }
        next();
    } catch (err) {
        next(err);
    }
};
