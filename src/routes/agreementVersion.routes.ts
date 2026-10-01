import { Router } from 'express';
import * as agreementVersionController from '../controllers/agreementVersion.controller.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import {
    validateCreateAgreementVersion,
    validateTerminateVersion,
    existingSelectedAgreementVersion,
} from '../middlewares/agreementVersion.validator.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import {
    checkServiceAuthentication,
    checkUserAuthentication,
} from '../middlewares/authenticator.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';

export const agreementVersionRoutes = Router();

agreementVersionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingScope,
    existingAgreementCollection,
    agreementVersionController.getAgreementVersionsByCollection,
);

agreementVersionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    agreementVersionController.getAgreementVersionByCollection,
);

agreementVersionRoutes.delete(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion',
    checkServiceAuthentication,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    agreementVersionController.deleteAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions',
    checkServiceAuthentication,
    existingScope,
    existingAgreementCollection,
    validateComputerHealth,
    validateCreateAgreementVersion,
    agreementVersionController.createAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/activeVersion/terminate',
    checkUserAuthentication,
    existingScope,
    existingAgreementCollection,
    validateTerminateVersion,
    agreementVersionController.terminateActiveVersion,
);
