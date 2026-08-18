import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as fetcherService from '../services/fetcher.service.js';

export const fetchAgreementVersionFetchResults = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';
        const isAsync = req.query.isAsync === 'true';
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const { date } = req.body;

        const { fetchResults, hasFailedFetchResults } =
            await fetcherService.fetchAgreementVersionFetchResults(
                orgName,
                scopeId,
                agColName,
                agreementVersion,
                new Date(date),
                expand,
                isAsync,
            );

        return sendSuccess(res, {
            data: fetchResults,
            message: hasFailedFetchResults
                ? 'Fetch results generated with failures'
                : 'Fetch results generated',
            httpStatus: hasFailedFetchResults ? 207 : 201,
        });
    } catch (err) {
        next(err);
    }
};

export const getConsolidationFetchesForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName, agreementVersion } = req.params;

        const fetches = await fetcherService.getConsolidationFetchesForAgreementVersion(
            orgName,
            scopeId,
            agColName,
            agreementVersion,
        );

        return sendSuccess(res, {
            data: fetches,
            message: 'Consolidation fetches retrieved',
        });
    } catch (err) {
        next(err);
    }
};

export const createConsolidationFetchTasksForAgreementVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName, agreementVersion } = req.params;
        const enabled = req.query.enabled === undefined || req.query.enabled === 'true';

        const fetchTasks = await fetcherService.createConsolidationFetchTasksForAgreementVersion(
            orgName,
            scopeId,
            agColName,
            agreementVersion,
            enabled,
        );
        return sendSuccess(res, {
            data: fetchTasks,
            message: 'Consolidation fetch tasks created',
        });
    } catch (err) {
        next(err);
    }
};
