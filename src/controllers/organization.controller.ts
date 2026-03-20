import { Request, Response, NextFunction } from 'express';
import * as organizationService from '../services/organization.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import type { ExpandMode } from '../types/membership.types.js';

export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.createOrganization(
            req.body,
            req.auth!.userId,
        );
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

export const addElementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.addField(
            'elementFields',
            req.params.orgName,
            req.body,
        );
        return sendSuccess(res, {
            data: organization,
            httpStatus: 201,
            message: 'ElementField added',
        });
    } catch (err) {
        next(err);
    }
};

export const updateElementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.updateField(
            'elementFields',
            req.params.orgName,
            req.params.fieldName,
            req.body,
        );
        return sendSuccess(res, { data: organization, message: 'ElementField updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteElementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.deleteField(
            'elementFields',
            req.params.orgName,
            req.params.fieldName,
        );
        return sendSuccess(res, { data: organization, message: 'ElementField deleted' });
    } catch (err) {
        next(err);
    }
};

export const addAgreementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.addField(
            'agreementFields',
            req.params.orgName,
            req.body,
        );
        return sendSuccess(res, {
            data: organization,
            httpStatus: 201,
            message: 'AgreementField added',
        });
    } catch (err) {
        next(err);
    }
};

export const updateAgreementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.updateField(
            'agreementFields',
            req.params.orgName,
            req.params.fieldName,
            req.body,
        );
        return sendSuccess(res, { data: organization, message: 'AgreementField updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteAgreementField = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.deleteField(
            'agreementFields',
            req.params.orgName,
            req.params.fieldName,
        );
        return sendSuccess(res, { data: organization, message: 'AgreementField deleted' });
    } catch (err) {
        next(err);
    }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const expand = (req.query.expand as ExpandMode) || 'none';
        const members = await organizationService.getMembers(req.params.orgName, expand);
        return sendSuccess(res, { data: members });
    } catch (err) {
        next(err);
    }
};

export const addUserToOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.addUserToOrganization(
            req.params.orgName,
            req.body.username,
        );
        return sendSuccess(res, { data: organization, message: 'User added to organization' });
    } catch (err) {
        next(err);
    }
};

export const removeUserFromOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await organizationService.removeUserFromOrganization(
            req.params.orgName,
            req.params.username,
        );
        return sendSuccess(res, { data: null, message: 'User removed from organization' });
    } catch (err) {
        next(err);
    }
};

export const addRoleToUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.addRoleToUser(
            req.params.orgName,
            req.params.username,
            req.body.roleName,
        );
        return sendSuccess(res, { data: organization, message: 'Role added to user' });
    } catch (err) {
        next(err);
    }
};

export const removeRoleFromUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organization = await organizationService.removeRoleFromUser(
            req.params.orgName,
            req.params.username,
            req.params.roleName,
        );
        return sendSuccess(res, { data: organization, message: 'Role removed from user' });
    } catch (err) {
        next(err);
    }
};
