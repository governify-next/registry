import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';

export const existingScope = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = await scopeManagerIntegration.getScopeByOrgAndScopeId(
            req.params.orgName,
            req.params.scopeId,
        );
        if (!scope)
            throw new ValidationError(
                `Scope with id ${req.params.scopeId} does not exist in organization ${req.params.orgName}`,
            );
        next();
    } catch (err) {
        next(err);
    }
};
