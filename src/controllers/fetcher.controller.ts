import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as fetcherService from '../services/fetcher.service.js';

export const fetchAuditableVersionFetchResults = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';
        const isAsync = req.query.isAsync === 'true';
        const { orgName, scopeId, agColName } = req.params;
        const { date } = req.body;

        const { fetchResults, hasFailedFetchResults } =
            await fetcherService.fetchAuditableVersionFetchResults(
                orgName,
                scopeId,
                agColName,
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

export const getConsolidationFetchesForAuditableVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, scopeId, agColName } = req.params;

        const fetches = await fetcherService.getConsolidationFetchesForAuditableVersion(
            orgName,
            scopeId,
            agColName,
        );

        return sendSuccess(res, {
            data: fetches,
            message: 'Consolidation fetches retrieved',
        });
    } catch (err) {
        next(err);
    }
};

export const createConsolidationFetchTasksForAuditableVersion = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, elementName, agColName } = req.params;
        const enabled = req.query.enabled === 'true';

        const fetchTasks = await fetcherService.createConsolidationFetchTasksForAuditableVersion(
            orgName,
            elementName,
            agColName,
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
