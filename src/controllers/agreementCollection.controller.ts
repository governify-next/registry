import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';

export const getAgreementCollectionsByScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const agreementCollections =
            await agreementCollectionService.getAgreementCollectionsByScope(
                req.params.orgName,
                req.params.scopeName,
                expand,
            );
        return sendSuccess(res, { data: agreementCollections });
    } catch (err) {
        next(err);
    }
};

export const getAgreementCollectionByScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const agreementCollection = await agreementCollectionService.getAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeName,
            req.params.agColName,
            expand,
        );
        return sendSuccess(res, { data: agreementCollection });
    } catch (err) {
        next(err);
    }
};

export const createAgreementCollectionByScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementCollection =
            await agreementCollectionService.createAgreementCollectionByScope(
                req.params.orgName,
                req.params.scopeName,
                req.body,
            );
        return sendSuccess(res, {
            data: agreementCollection,
            httpStatus: 201,
            message: 'Agreement collection created',
        });
    } catch (err) {
        next(err);
    }
};

export const updateAgreementCollectionByScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementCollection =
            await agreementCollectionService.updateAgreementCollectionByScope(
                req.params.orgName,
                req.params.scopeName,
                req.params.agColName,
                req.body,
            );
        return sendSuccess(res, {
            data: agreementCollection,
            message: 'Agreement collection updated',
        });
    } catch (err) {
        next(err);
    }
};

export const deleteAgreementCollectionByScope = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await agreementCollectionService.deleteAgreementCollectionByScope(
            req.params.orgName,
            req.params.scopeName,
            req.params.agColName,
        );
        return sendSuccess(res, {
            data: null,
            message: 'Agreement collection deleted',
        });
    } catch (err) {
        next(err);
    }
};
