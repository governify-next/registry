import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as agreementCollectionService from '../services/agreementCollection.service.js';

export const getAgreementCollectionsByElement = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const agreementCollections =
            await agreementCollectionService.getAgreementCollectionsByElement(
                req.params.orgName,
                req.params.elementName,
                expand,
            );
        return sendSuccess(res, { data: agreementCollections });
    } catch (err) {
        next(err);
    }
};

export const getAgreementCollectionByElement = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const expand = req.query.expand === 'true';

        const agreementCollection =
            await agreementCollectionService.getAgreementCollectionByElement(
                req.params.orgName,
                req.params.elementName,
                req.params.agColName,
                expand,
            );
        return sendSuccess(res, { data: agreementCollection });
    } catch (err) {
        next(err);
    }
};

export const createAgreementCollectionByElement = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementCollection =
            await agreementCollectionService.createAgreementCollectionByElement(
                req.params.orgName,
                req.params.elementName,
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

export const updateAgreementCollectionByElement = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const agreementCollection =
            await agreementCollectionService.updateAgreementCollectionByElement(
                req.params.orgName,
                req.params.elementName,
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

export const deleteAgreementCollectionByElement = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        await agreementCollectionService.deleteAgreementCollectionByElement(
            req.params.orgName,
            req.params.elementName,
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
