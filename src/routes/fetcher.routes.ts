import { Router } from 'express';
import * as fetcherController from '../controllers/fetcher.controller.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingAuditableVersion } from '../middlewares/agreementVersion.validator.js';
import { validateCollectorHealth } from '../middlewares/collector.validator.js';
import { validateFetchAuditableVersionBody } from '../middlewares/fetcher.validator.js';

export const fetcherRoutes = Router();

fetcherRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/fetch',
    validateCollectorHealth,
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    validateFetchAuditableVersionBody,
    fetcherController.fetchAuditableVersionFetchResults,
);

fetcherRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/consolidated',
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    fetcherController.getConsolidationFetchesForAuditableVersion,
);
