import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';

export const existingElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const element = await scopeManagerIntegration.getElementByOrgAndNameAndElementName(
            req.params.orgName,
            req.params.elementName,
        );
        if (!element)
            throw new ValidationError(
                `Element with name ${req.params.elementName} does not exist in organization ${req.params.orgName}`,
            );
        next();
    } catch (err) {
        next(err);
    }
};
