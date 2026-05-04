import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';

export const generateStatesForAuditableVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const isAsync = req.query.isAsync === 'true';
        const { orgName, elementName, agColName } = req.params;
        const { date } = req.body;
        const states = await stateService.generateStatesForAuditableVersion(
            isAsync,
            orgName,
            elementName,
            agColName,
            date,
        );
        return sendSuccess(res, {
            data: states,
            message: isAsync ? 'States created' : 'States created and generated',
        });
    } catch (err) {
        next(err);
    }
};

export const getStatesForAuditableVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, elementName, agColName } = req.params;
        const states = await stateService.getStatesForAuditableVersion(
            orgName,
            elementName,
            agColName,
        );
        return sendSuccess(res, {
            data: states,
            message: 'States retrieved',
        });
    } catch (err) {
        next(err);
    }
};
