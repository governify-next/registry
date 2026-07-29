import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingAuditableVersion } from '../middlewares/agreementVersion.validator.js';
import { validateGenerateConsolidatedStatesBody } from '../middlewares/state.validator.js';

export const stateRoutes = Router();

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/states/generate',
    validateComputerHealth,
    stateController.generateStatesForAuditableVersion,
);

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/states/consolidated/generate',
    validateComputerHealth,
    existingScope,
    existingAgreementCollection,
    existingAuditableVersion,
    validateGenerateConsolidatedStatesBody,
    stateController.generateConsolidatedStatesForAuditableVersion,
);

stateRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColName/agreementVersions/auditableVersion/states',
    stateController.getStatesForAuditableVersion,
);
