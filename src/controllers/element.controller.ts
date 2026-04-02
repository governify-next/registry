import { Request, Response, NextFunction } from 'express';
import * as elementService from '../services/element.service.js';
import * as organizationService from '../services/organization.service.js';
import { sendSuccess } from '../utils/standardResponse.js';

export const createElement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const element = await elementService.createElement(organization!._id, req.body);
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
        const elements = await elementService.getElementsByOrganization(organization!._id);
        return sendSuccess(res, { data: elements });
    } catch (err) {
        next(err);
    }
};

export const getElementByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const element = await elementService.getElementByName(
            organization!._id,
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
            organization!._id,
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
        await elementService.deleteElement(organization!._id, req.params.elementName);
        return sendSuccess(res, { data: null, message: 'Element deleted' });
    } catch (err) {
        next(err);
    }
};

export const getElementParts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const parts = await elementService.getElementParts(
            organization!._id,
            req.params.elementName,
        );
        return sendSuccess(res, { data: parts });
    } catch (err) {
        next(err);
    }
};

export const addElementPart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const part = await elementService.addElementPart(
            organization!._id,
            req.params.elementName,
            {
                auditConfig: req.body.auditConfig,
            },
        );
        return sendSuccess(res, {
            data: part,
            httpStatus: 201,
            message: 'Element part created',
        });
    } catch (err) {
        next(err);
    }
};

export const getElementPartById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const part = await elementService.getElementPartById(
            organization!._id,
            req.params.elementName,
            req.params.partId,
        );
        return sendSuccess(res, { data: part });
    } catch (err) {
        next(err);
    }
};

export const updateElementPart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const part = await elementService.updateElementPart(
            organization!._id,
            req.params.elementName,
            req.params.partId,
            {
                auditConfig: req.body.auditConfig,
            },
        );
        return sendSuccess(res, {
            data: part,
            message: 'Element part updated',
        });
    } catch (err) {
        next(err);
    }
};

export const deleteElementPart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        await elementService.deleteElementPart(
            organization!._id,
            req.params.elementName,
            req.params.partId,
        );
        return sendSuccess(res, { data: null, message: 'Element part deleted' });
    } catch (err) {
        next(err);
    }
};

export const addRoleToElementPermission = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        const element = await elementService.addRoleToElementPermission(
            organization!._id,
            req.params.elementName,
            req.params.permissionName,
            req.body.roles,
        );
        return sendSuccess(res, {
            data: element,
            message: 'Role added to element permission',
        });
    } catch (err) {
        next(err);
    }
};
