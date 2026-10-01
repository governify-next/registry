import { Router } from 'express';
import * as fetcherController from '../controllers/fetcher.controller.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingSelectedAgreementVersion } from '../middlewares/agreementVersion.validator.js';
import { validateFetcherHealth } from '../middlewares/fetcher.validator.js';
import { validateFetchAgreementVersionBody } from '../middlewares/fetch.validator.js';
import { validateDirectorHealth } from '../middlewares/director.validator.js';
import { checkServiceAuthentication } from '../middlewares/authenticator.validator.js';

export const fetcherRoutes = Router();

// This is not used for now
fetcherRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/fetchers/fetch',
    checkServiceAuthentication,
    validateFetcherHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateFetchAgreementVersionBody,
    fetcherController.fetchAgreementVersionFetchResults,
);

// This is not used for now
fetcherRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/fetchers/consolidated',
    checkServiceAuthentication,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    fetcherController.getConsolidationFetchesForAgreementVersion,
);

fetcherRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/tasks/fetchers/consolidated',
    checkServiceAuthentication,
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    fetcherController.createConsolidationFetchTasksForAgreementVersion,
);
