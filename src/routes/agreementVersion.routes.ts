import { Router } from 'express';
import * as agreementVersionController from '../controllers/agreementVersion.controller.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import {
    validateCreateAgreementVersion,
    validateTerminateVersion,
    existingAuditableVersion,
    existingVersionNumber,
} from '../middlewares/agreementVersion.validator.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';

export const agreementVersionRoutes = Router();

agreementVersionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions',
    existingScope,
    existingAgreementCollection,
    agreementVersionController.getAgreementVersionsByCollection,
);

agreementVersionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/auditableVersion',
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    agreementVersionController.getAuditableVersionByCollection,
);

agreementVersionRoutes.delete(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/:versionNumber',
    existingScope,
    existingAgreementCollection,
    existingVersionNumber,
    agreementVersionController.deleteAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions',
    existingScope,
    existingAgreementCollection,
    validateComputerHealth,
    validateCreateAgreementVersion,
    agreementVersionController.createAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/activeVersion/terminate',
    existingScope,
    existingAgreementCollection,
    validateTerminateVersion,
    agreementVersionController.terminateActiveVersion,
);
