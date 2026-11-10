import { type Request, type Response, type NextFunction } from 'express';
import { ForbiddenError } from '../utils/customErrors.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';

export const existingOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await scopeManagerIntegration.getOrganizationByName(
            req.params.orgName,
            req.headers.authorization,
        );
        next();
    } catch (err) {
        next(err);
    }
};

export const isOrganizationAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isAdmin = await scopeManagerIntegration.isUserOrganizationAdmin(
            req.params.orgName,
            req.headers.authorization!,
        );
        if (!isAdmin)
            return next(
                new ForbiddenError(`User is not an admin of organization '${req.params.orgName}'`),
            );
        next();
    } catch (err) {
        next(err);
    }
};
