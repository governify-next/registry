import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError } from '../utils/customErrors.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';

export const getOrganizationOrFail = async (orgName: string) => {
    const org = await scopeManagerIntegration.getOrganizationByName(orgName);
    if (!org) throw new NotFoundError(`Organization with name ${orgName} does not exist`);
    return org;
};

export const existingOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await getOrganizationOrFail(req.params.orgName);
        next();
    } catch (err) {
        next(err);
    }
};
