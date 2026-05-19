import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as fetcherService from '../services/fetcher.service.js';

export const fetchAuditableVersionFetchResults = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { orgName, elementName, agColName } = req.params;
        const { date } = req.body;

        const { fetchResults, hasFailedFetchResults } =
            await fetcherService.fetchAuditableVersionFetchResults(
                orgName,
                elementName,
                agColName,
                new Date(date),
            );

        return sendSuccess(res, {
            data: fetchResults,
            message: hasFailedFetchResults
                ? 'Fetch results generated with failures'
                : 'Fetch results generated',
            httpStatus: hasFailedFetchResults ? 207 : 200,
        });
    } catch (err) {
        next(err);
    }
};
