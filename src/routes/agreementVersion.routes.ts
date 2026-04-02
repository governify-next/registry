import { Router } from 'express';
import * as agreementVersionController from '../controllers/agreementVersion.controller.js';
import { existingElement } from '../middlewares/element.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import {
    validateCreateAgreementVersion,
    validateTerminateVersion,
    existingAuditableVersion,
    existingVersionNumber,
} from '../middlewares/agreementVersion.validator.js';

export const agreementVersionRoutes = Router();

agreementVersionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions',
    existingElement,
    existingAgreementCollection,
    agreementVersionController.getAgreementVersionsByCollection,
);

agreementVersionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion',
    existingElement,
    existingAgreementCollection,
    existingAuditableVersion,
    agreementVersionController.getAuditableVersionByCollection,
);

agreementVersionRoutes.delete(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/:versionNumber',
    existingElement,
    existingAgreementCollection,
    existingVersionNumber,
    agreementVersionController.deleteAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions',
    existingElement,
    existingAgreementCollection,
    validateCreateAgreementVersion,
    agreementVersionController.createAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/activeVersion/terminate',
    existingElement,
    existingAgreementCollection,
    validateTerminateVersion,
    agreementVersionController.terminateActiveVersion,
);
