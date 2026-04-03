import { Router } from 'express';
import * as agreementCollectionController from '../controllers/agreementCollection.controller.js';
import {
    validateCreateAgreementCollection,
    validateUpdateAgreementCollection,
    existingAgreementCollection,
} from '../middlewares/agreementCollection.validator.js';
import { existingElement } from '../middlewares/element.validator.js';

export const agreementCollectionRoutes = Router();

agreementCollectionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections',
    existingElement,
    agreementCollectionController.getAgreementCollectionsByElement,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName',
    existingElement,
    existingAgreementCollection,
    agreementCollectionController.getAgreementCollectionByElement,
);

agreementCollectionRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections',
    existingElement,
    validateCreateAgreementCollection,
    agreementCollectionController.createAgreementCollectionByElement,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName',
    existingElement,
    validateUpdateAgreementCollection,
    agreementCollectionController.updateAgreementCollectionByElement,
);

agreementCollectionRoutes.delete(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName',
    existingElement,
    existingAgreementCollection,
    agreementCollectionController.deleteAgreementCollectionByElement,
);
