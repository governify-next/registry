import { Router } from 'express';
import * as agreementCollectionController from '../controllers/agreementCollection.controller.js';
import {
    validateCreateAgreementCollection,
    validateUpdateAgreementCollection,
    existingAgreementCollection,
} from '../middlewares/agreementCollection.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';

export const agreementCollectionRoutes = Router();

agreementCollectionRoutes.get(
    '/organizations/:orgName/scopes/:scopeName/agreementCollections',
    existingScope,
    agreementCollectionController.getAgreementCollectionsByScope,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/scopes/:scopeName/agreementCollections/:agColName',
    existingScope,
    existingAgreementCollection,
    agreementCollectionController.getAgreementCollectionByScope,
);

agreementCollectionRoutes.post(
    '/organizations/:orgName/scopes/:scopeName/agreementCollections',
    existingScope,
    validateCreateAgreementCollection,
    agreementCollectionController.createAgreementCollectionByScope,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/scopes/:scopeName/agreementCollections/:agColName',
    existingScope,
    validateUpdateAgreementCollection,
    agreementCollectionController.updateAgreementCollectionByScope,
);

agreementCollectionRoutes.delete(
    '/organizations/:orgName/scopes/:scopeName/agreementCollections/:agColName',
    existingScope,
    existingAgreementCollection,
    agreementCollectionController.deleteAgreementCollectionByScope,
);
