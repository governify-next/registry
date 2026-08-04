import { Router } from 'express';
import * as fetcherController from '../controllers/fetcher.controller.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingAuditableVersion } from '../middlewares/agreementVersion.validator.js';
import { validateFetcherHealth } from '../middlewares/fetcher.validator.js';
import { validateFetchAuditableVersionBody } from '../middlewares/fetch.validator.js';
import { validateDirectorHealth } from '../middlewares/director.validator.js';

export const fetcherRoutes = Router();

// This is not used for now
fetcherRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/fetch',
    validateFetcherHealth,
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    validateFetchAuditableVersionBody,
    fetcherController.fetchAuditableVersionFetchResults,
);

// This is not used for now
fetcherRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/consolidated',
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    fetcherController.getConsolidationFetchesForAuditableVersion,
);

fetcherRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/tasks/fetchers/consolidated',
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    fetcherController.createConsolidationFetchTasksForAuditableVersion,
);
