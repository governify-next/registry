import { Request, Response, NextFunction } from 'express';
import * as organizationService from '../services/organization.service.js';
import { sendSuccess } from '../utils/standardResponse.js';

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.createOrganization(req.body);
        return sendSuccess(res, {
            data: organization,
            httpStatus: 201,
            message: 'Organization created',
        });
    } catch (err) {
        next(err);
    }
};

export const getOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizations = await organizationService.getOrganizations();
        return sendSuccess(res, { data: organizations });
    } catch (err) {
        next(err);
    }
};

export const getOrganizationByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.getOrganizationByName(req.params.orgName);
        return sendSuccess(res, { data: organization });
    } catch (err) {
        next(err);
    }
};

export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.updateOrganization(
            req.params.orgName,
            req.body,
        );
        return sendSuccess(res, { data: organization, message: 'Organization updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organizationService.deleteOrganization(req.params.orgName);
        return sendSuccess(res, { data: null, message: 'Organization deleted' });
    } catch (err) {
        next(err);
    }
};

export const addRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.addRole(req.params.orgName, req.body);
        return sendSuccess(res, { data: organization, httpStatus: 201, message: 'Role added' });
    } catch (err) {
        next(err);
    }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.updateRole(
            req.params.orgName,
            req.params.roleName,
            req.body,
        );
        return sendSuccess(res, { data: organization, message: 'Role updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.deleteRole(
            req.params.orgName,
            req.params.roleName,
        );
        return sendSuccess(res, { data: organization, message: 'Role deleted' });
    } catch (err) {
        next(err);
    }
};
