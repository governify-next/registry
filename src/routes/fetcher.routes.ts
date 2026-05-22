import { Router } from 'express';
import * as fetcherController from '../controllers/fetcher.controller.js';
import { existingElement } from '../middlewares/element.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingAuditableVersion } from '../middlewares/agreementVersion.validator.js';
import { validateCollectorHealth } from '../middlewares/collector.validator.js';
import { validateFetchAuditableVersionBody } from '../middlewares/fetcher.validator.js';

export const fetcherRoutes = Router();

fetcherRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/fetch',
    validateCollectorHealth,
    existingElement,
    existingAgreementCollection,
    existingAuditableVersion,
    validateFetchAuditableVersionBody,
    fetcherController.fetchAuditableVersionFetchResults,
);

fetcherRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/consolidated',
    existingElement,
    existingAgreementCollection,
    existingAuditableVersion,
    fetcherController.getConsolidationFetchesForAuditableVersion,
);
