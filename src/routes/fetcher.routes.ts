import { Router } from 'express';
import * as fetcherController from '../controllers/fetcher.controller.js';
import { existingElement } from '../middlewares/element.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingAuditableVersion } from '../middlewares/agreementVersion.validator.js';
import { validateFetcherHealth } from '../middlewares/fetcher.validator.js';
import { validateFetchAuditableVersionBody } from '../middlewares/fetch.validator.js';
import { validateDirectorHealth } from '../middlewares/director.validator.js';

export const fetcherRoutes = Router();

// This is not used for now
fetcherRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/fetch',
    validateFetcherHealth,
    existingElement,
    existingAgreementCollection,
    existingAuditableVersion,
    validateFetchAuditableVersionBody,
    fetcherController.fetchAuditableVersionFetchResults,
);

// This is not used for now
fetcherRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/fetchers/consolidatedDates',
    existingElement,
    existingAgreementCollection,
    existingAuditableVersion,
    fetcherController.getConsolidationFetchesForAuditableVersion,
);

fetcherRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/tasks/fetchers/consolidated',
    validateDirectorHealth,
    existingElement,
    existingAgreementCollection,
    existingAuditableVersion,
    fetcherController.createConsolidationFetchTasksForAuditableVersion,
);
