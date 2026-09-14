import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { StdError } from './customErrors.js';

type NormalizedError = {
    message: string;
    httpStatus: number;
    appCode: string;
    details?: unknown;
};

function normalizeError(err: unknown): NormalizedError {
    if (err instanceof StdError) {
        return {
            message: err.message,
            httpStatus: err.httpStatus,
            appCode: err.appCode,
            details: err.details,
        };
    }
    // Malformed id in routes
    if (err instanceof MongooseError.CastError) {
        return { message: 'Invalid id', httpStatus: 400, appCode: 'VALIDATION_ERROR' };
    }
    if (err instanceof Error) {
        return { message: err.message, httpStatus: 500, appCode: 'UNKNOWN_ERROR' };
    }
    return { message: 'Unknown error', httpStatus: 500, appCode: 'UNKNOWN_ERROR' };
}

export function sendSuccess(
    res: Response,
    {
        data,
        message = 'OK',
        httpStatus = 200,
        appCode = 'SUCCESS',
    }: {
        data: unknown;
        message?: string;
        httpStatus?: number;
        appCode?: string;
    },
) {
    const response = {
        success: true,
        message,
        httpStatus,
        appCode,
        data,
        error: null,
    };
    return res.status(httpStatus).json(response);
}

export function sendError(res: Response, err: unknown) {
    const parsed = normalizeError(err);
    const response = {
        success: false,
        message: parsed.message,
        httpStatus: parsed.httpStatus,
        appCode: parsed.appCode,
        data: null,
        error: {
            message: parsed.message,
            details: parsed.details,
        },
    };
    return res.status(parsed.httpStatus).json(response);
}
