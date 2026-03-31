import { Router } from 'express';
import * as agreementCollectionController from '../controllers/agreementCollection.controller.js';

export const agreementCollectionRoutes = Router();

agreementCollectionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections',
    agreementCollectionController.getAgreementCollectionsByElement,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName',
    agreementCollectionController.getAgreementCollectionByElement,
);

agreementCollectionRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections',
    agreementCollectionController.createAgreementCollectionByElement,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName',
    agreementCollectionController.updateAgreementCollectionByElement,
);

agreementCollectionRoutes.delete(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName',
    agreementCollectionController.deleteAgreementCollectionByElement,
);
