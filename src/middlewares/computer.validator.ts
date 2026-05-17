import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import * as computerIntegration from '../integrations/computer.integration.js';

export const validateComputerHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const computerHealth = await computerIntegration.checkHealth();
        if (!computerHealth) {
            return next(new ValidationError('Computer service is not available'));
        }
        next();
    } catch (err) {
        next(err);
    }
};
