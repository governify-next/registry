import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';
import { ExistingStatePolicy, TemporalMode } from '../types/temporal.types.js';

export const generateStatesForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const isAsync = req.query.isAsync === 'true';
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const { date, temporalMode, ifExists, signatureIds } = req.body;
        const states = await stateService.generateStatesForAgreementVersion(
            isAsync,
            orgName,
            scopeId,
            agColName,
            agreementVersion,
            {
                effectiveAt: new Date(date),
                mode: temporalMode as TemporalMode,
            },
            ifExists as ExistingStatePolicy,
            signatureIds as string[] | undefined,
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

export const generateConsolidatedStatesForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const isAsync = req.query.isAsync === 'true';
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const { date, startDate, endDate, temporalMode, ifExists, signatureIds } = req.body;
        const requestedStartDate = new Date(date ?? startDate);
        const requestedEndDate = new Date(date ?? endDate);

        const states = await stateService.generateConsolidatedStatesForAgreementVersion(
            isAsync,
            orgName,
            scopeId,
            agColName,
            agreementVersion,
            requestedStartDate,
            requestedEndDate,
            temporalMode as TemporalMode,
            ifExists as ExistingStatePolicy,
            signatureIds as string[] | undefined,
        );

        if (states.length === 0) {
            return sendSuccess(res, {
                data: states,
                message: 'No guarantees have consolidation points in the requested date or range',
                httpStatus: 200,
            });
        }

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

export const getStatesForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const states = await stateService.getStatesForAgreementVersion(
            orgName,
            scopeId,
            agColName,
            agreementVersion,
        );
        return sendSuccess(res, {
            data: states,
            message: 'States retrieved',
        });
    } catch (err) {
        next(err);
    }
};

export const createConsolidationStateTasksForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const { signatureIds } = req.body ?? {};
        const enabled = req.query.enabled === undefined || req.query.enabled === 'true';

        const stateTasks = await stateService.createConsolidationStateTasksForAgreementVersion(
            orgName,
            scopeId,
            agColName,
            agreementVersion,
            enabled,
            signatureIds as string[] | undefined,
        );

        return sendSuccess(res, {
            data: stateTasks,
            message: 'Consolidation state tasks created',
            httpStatus: 201,
        });
    } catch (err) {
        next(err);
    }
};

export const getConsolidationStateTasksForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const stateTasks = await stateService.getConsolidationStateTasksForAgreementVersion(
            orgName,
            scopeId,
            agColName,
            agreementVersion,
        );

        return sendSuccess(res, {
            data: stateTasks,
            message: 'Consolidation state tasks retrieved',
        });
    } catch (err) {
        next(err);
    }
};

export const deleteConsolidationStateTasksForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const result = await stateService.deleteConsolidationStateTasksForAgreementVersion(
            orgName,
            scopeId,
            agColName,
            agreementVersion,
        );

        return sendSuccess(res, {
            data: result,
            message: 'Consolidation state tasks deleted',
        });
    } catch (err) {
        next(err);
    }
};
