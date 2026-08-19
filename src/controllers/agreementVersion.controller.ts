import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as agreementVersionService from '../services/agreementVersion.service.js';

export const getAgreementVersionsByCollection = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const agreementVersions = await agreementVersionService.getAgreementVersionsByCollection(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColName,
            expand,
        );
        return sendSuccess(res, { data: agreementVersions });
    } catch (err) {
        next(err);
    }
};

export const createAgreementVersionByCollection = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementVersion = await agreementVersionService.createAgreementVersionByCollection(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColName,
            req.body,
        );
        return sendSuccess(res, {
            data: agreementVersion,
            httpStatus: 201,
            message: 'Agreement version created',
        });
    } catch (err) {
        next(err);
    }
};

export const getAuditableVersionByCollection = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const auditableVersion = await agreementVersionService.getAuditableVersionByCollection(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColId,
            expand,
        );
        return sendSuccess(res, { data: auditableVersion });
    } catch (err) {
        next(err);
    }
};

export const deleteAgreementVersionByCollection = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await agreementVersionService.deleteVersionByCollection(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColName,
            Number(req.params.versionNumber),
        );
        return sendSuccess(res, {
            data: null,
            message: 'Agreement version deleted',
        });
    } catch (err) {
        next(err);
    }
};

export const terminateActiveVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await agreementVersionService.terminateActiveVersion(
            req.params.orgName,
            req.params.scopeId,
            req.params.agColName,
            req.body.earlyTermination,
        );
        return sendSuccess(res, {
            data: result,
            message: 'Active version terminated',
        });
    } catch (err) {
        next(err);
    }
};
