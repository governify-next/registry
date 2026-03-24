import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as guaranteeTemplateService from '../services/guaranteeTemplate.service.js';

export const getGuaranteeTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const guaranteeTemplate = await guaranteeTemplateService.getGuaranteeTemplate(
            req.params.guaranteeName,
        );
        return sendSuccess(res, { data: guaranteeTemplate });
    } catch (err) {
        next(err);
    }
};

export const getGuaranteeTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const guaranteeTemplates = await guaranteeTemplateService.getGuaranteeTemplates();
        return sendSuccess(res, { data: guaranteeTemplates });
    } catch (err) {
        next(err);
    }
};

export const createGuaranteeTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const guaranteeTemplate = await guaranteeTemplateService.createGuaranteeTemplate(req.body);
        return sendSuccess(res, { data: guaranteeTemplate, message: 'Guarantee template created' });
    } catch (err) {
        next(err);
    }
};

export const updateGuaranteeTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const guaranteeTemplate = await guaranteeTemplateService.updateGuaranteeTemplate(
            req.params.guaranteeName,
            req.body,
        );
        return sendSuccess(res, { data: guaranteeTemplate, message: 'Guarantee template updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteGuaranteeTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedTemplate = await guaranteeTemplateService.deleteGuaranteeTemplate(
            req.params.guaranteeName,
        );
        return sendSuccess(res, { data: null, message: 'Guarantee template deleted' });
    } catch (err) {
        next(err);
    }
};
