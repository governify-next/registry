import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as agreementTemplateService from '../services/agreementTemplate.service.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';

export const getAgreementTemplateByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await scopeManagerIntegration.getOrganizationByName(
            req.params.orgName,
        );
        const agreementTemplate = await agreementTemplateService.getAgreementTemplateByOrganization(
            organization!._id,
            req.params.agreementTemplateName,
        );
        return sendSuccess(res, { data: agreementTemplate });
    } catch (err) {
        next(err);
    }
};

export const getAgreementTemplatesByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await scopeManagerIntegration.getOrganizationByName(
            req.params.orgName,
        );
        const agreementTemplates =
            await agreementTemplateService.getAgreementTemplatesByOrganization(organization!._id);
        return sendSuccess(res, { data: agreementTemplates });
    } catch (err) {
        next(err);
    }
};

export const createAgreementTemplateByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await scopeManagerIntegration.getOrganizationByName(
            req.params.orgName,
        );
        const agreementTemplate =
            await agreementTemplateService.createAgreementTemplateByOrganization(
                organization!._id,
                req.body,
            );
        return sendSuccess(res, {
            data: agreementTemplate,
            httpStatus: 201,
            message: 'Agreement template created',
        });
    } catch (err) {
        next(err);
    }
};

export const updateAgreementTemplateByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await scopeManagerIntegration.getOrganizationByName(
            req.params.orgName,
        );
        const agreementTemplate =
            await agreementTemplateService.updateAgreementTemplateByOrganization(
                organization!._id,
                req.params.agreementTemplateName,
                req.body,
            );
        return sendSuccess(res, { data: agreementTemplate, message: 'Agreement template updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteAgreementTemplateByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const organization = await scopeManagerIntegration.getOrganizationByName(
            req.params.orgName,
        );
        await agreementTemplateService.deleteAgreementTemplateByOrganization(
            organization!._id,
            req.params.agreementTemplateName,
        );
        return sendSuccess(res, { data: null, message: 'Agreement template deleted' });
    } catch (err) {
        next(err);
    }
};

export const getPublicAgreementTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementTemplates = await agreementTemplateService.getPublicAgreementTemplates();
        return sendSuccess(res, { data: agreementTemplates });
    } catch (err) {
        next(err);
    }
};
