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
        const { orgName, elementName, agColName } = req.params;
        const { date } = req.body;

        const { fetchResults, hasFailedFetchResults } =
            await fetcherService.fetchAuditableVersionFetchResults(
                orgName,
                elementName,
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
