import { Router } from 'express';
import * as agreementCollectionController from '../controllers/agreementCollection.controller.js';
import {
    validateCreateAgreementCollection,
    validateUpdateAgreementCollection,
    existingAgreementCollectionById,
} from '../middlewares/agreementCollection.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';
import {
    checkServiceAuthentication,
    checkUserAuthentication,
} from '../middlewares/authenticator.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';

export const agreementCollectionRoutes = Router();

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingOrganization,
    agreementCollectionController.getAgreementCollectionsByOrganization,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections/:agColId',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingOrganization,
    existingAgreementCollectionById,
    agreementCollectionController.getAgreementCollectionById,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/agreementCollections/:agColId',
    checkUserAuthentication,
    existingOrganization,
    existingAgreementCollectionById,
    validateUpdateAgreementCollection,
    agreementCollectionController.updateAgreementCollectionById,
);

agreementCollectionRoutes.delete(
    '/organizations/:orgName/agreementCollections/:agColId',
    checkServiceAuthentication,
    existingOrganization,
    existingAgreementCollectionById,
    agreementCollectionController.deleteAgreementCollectionById,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections',
    checkServiceAuthentication,
    existingScope,
    agreementCollectionController.getAgreementCollectionsByScope,
);

agreementCollectionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections',
    checkServiceAuthentication,
    existingScope,
    validateCreateAgreementCollection,
    agreementCollectionController.createAgreementCollectionByScope,
);
