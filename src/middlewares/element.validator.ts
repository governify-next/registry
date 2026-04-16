import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import { bootEnv } from '../config/bootConfig.js';

export const existingElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const element = await getElementByName(req.params.orgName, req.params.elementName);
        if (!element)
            throw new ValidationError(
                `Element with name ${req.params.elementName} does not exist in organization ${req.params.orgName}`,
            );
        next();
    } catch (err) {
        next(err);
    }
};

async function getElementByName(orgName: string, elementName: string) {
    const response = await fetch(
        `${bootEnv.SCOPE_MANAGER_URL}/api/v1/organizations/${orgName}/elements/${elementName}`,
        {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        },
    );
    const result = await response.json();

    return result.data;
}
