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
        const hasIndeterminateStates = !isAsync && states.some((state) => state.indeterminate);
        return sendSuccess(res, {
            data: states,
            message: isAsync ? 'States created' : 'States created and generated',
            httpStatus: hasIndeterminateStates ? 207 : 200,
        });
    } catch (err) {
        next(err);
    }
};

export const generateConsolidatedStatesForAuditableVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const isAsync = req.query.isAsync === 'true';
        const { orgName, elementName, agColName } = req.params;
        const { startDate, endDate } = req.body;

        const states = await stateService.generateConsolidatedStatesForAuditableVersion(
            isAsync,
            orgName,
            elementName,
            agColName,
            new Date(startDate),
            new Date(endDate),
        );

        const hasIndeterminateStates = !isAsync && states.some((state) => state.indeterminate);

        return sendSuccess(res, {
            data: states,
            message: isAsync
                ? 'Consolidated states created'
                : 'Consolidated states created and generated',
            httpStatus: hasIndeterminateStates ? 207 : 200,
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
