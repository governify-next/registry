import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';

export const getAgreementCollectionsByOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementCollections =
            await agreementCollectionService.getAgreementCollectionsByOrganization(
                req.params.orgName,
            );
        return sendSuccess(res, { data: agreementCollections });
    } catch (err) {
        next(err);
    }
};

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
                req.params.scopeId,
                expand,
            );
        return sendSuccess(res, { data: agreementCollections });
    } catch (err) {
        next(err);
    }
};

export const getAgreementCollectionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const agreementCollection = await agreementCollectionService.getAgreementCollectionById(
            req.params.agColId,
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
                req.params.scopeId,
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

export const updateAgreementCollectionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementCollection = await agreementCollectionService.updateAgreementCollectionById(
            req.params.agColId,
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

export const deleteAgreementCollectionById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await agreementCollectionService.deleteAgreementCollectionById(req.params.agColId);
        return sendSuccess(res, {
            data: null,
            message: 'Agreement collection deleted',
        });
    } catch (err) {
        next(err);
    }
};
