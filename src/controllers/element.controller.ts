import { Request, Response, NextFunction } from 'express';
import * as elementService from '../services/element.service.js';
import * as organizationService from '../services/organization.service.js';
import { sendSuccess } from '../utils/standardResponse.js';

export const createElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const element = await elementService.createElement(organization._id, req.body);
        return sendSuccess(res, {
            data: element,
            httpStatus: 201,
            message: 'Element created',
        });
    } catch (err) {
        next(err);
    }
};

export const getElementsByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const elements = await elementService.getElementsByOrganization(organization._id);
        return sendSuccess(res, { data: elements });
    } catch (err) {
        next(err);
    }
};

export const getElementByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const element = await elementService.getElementByName(
            organization._id,
            req.params.elementName,
        );
        return sendSuccess(res, { data: element });
    } catch (err) {
        next(err);
    }
};

export const updateElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const element = await elementService.updateElement(
            organization._id,
            req.params.elementName,
            req.body,
        );
        return sendSuccess(res, { data: element, message: 'Element updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        await elementService.deleteElement(organization._id, req.params.elementName);
        return sendSuccess(res, { data: null, message: 'Element deleted' });
    } catch (err) {
        next(err);
    }
};
