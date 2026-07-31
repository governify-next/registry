import { Router } from 'express';
import * as agreementCollectionController from '../controllers/agreementCollection.controller.js';
import {
    validateCreateAgreementCollection,
    validateUpdateAgreementCollection,
    existingAgreementCollectionById,
} from '../middlewares/agreementCollection.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';

export const agreementCollectionRoutes = Router();

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections',
    existingOrganization,
    agreementCollectionController.getAgreementCollectionsByOrganization,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections/:agColId',
    existingOrganization,
    existingAgreementCollectionById,
    agreementCollectionController.getAgreementCollectionById,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/agreementCollections/:agColId',
    existingOrganization,
    existingAgreementCollectionById,
    validateUpdateAgreementCollection,
    agreementCollectionController.updateAgreementCollectionById,
);

agreementCollectionRoutes.delete(
    '/organizations/:orgName/agreementCollections/:agColId',
    existingOrganization,
    existingAgreementCollectionById,
    agreementCollectionController.deleteAgreementCollectionById,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections',
    existingScope,
    agreementCollectionController.getAgreementCollectionsByScope,
);

agreementCollectionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections',
    existingScope,
    validateCreateAgreementCollection,
    agreementCollectionController.createAgreementCollectionByScope,
);
