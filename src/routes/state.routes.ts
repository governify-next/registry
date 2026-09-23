import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingSelectedAgreementVersion } from '../middlewares/agreementVersion.validator.js';
import {
    validateCreateConsolidationStateTasksRequest,
    validateGenerateConsolidatedStatesBody,
    validateGenerateStatesBody,
    validateSearchStatesBody,
} from '../middlewares/state.validator.js';
import { validateDirectorHealth } from '../middlewares/director.validator.js';

export const stateRoutes = Router();

const consolidationStateTasksPath =
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/tasks/states/consolidated';

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/generate',
    validateComputerHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateGenerateStatesBody,
    stateController.generateStatesForAgreementVersion,
);

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/consolidated/generate',
    validateComputerHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateGenerateConsolidatedStatesBody,
    stateController.generateConsolidatedStatesForAgreementVersion,
);

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/search',
    validateSearchStatesBody,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.searchStatesForAgreementVersion,
);

stateRoutes.post(
    consolidationStateTasksPath,
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateCreateConsolidationStateTasksRequest,
    stateController.createConsolidationStateTasksForAgreementVersion,
);

stateRoutes.get(
    consolidationStateTasksPath,
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.getConsolidationStateTasksForAgreementVersion,
);

stateRoutes.delete(
    consolidationStateTasksPath,
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.deleteConsolidationStateTasksForAgreementVersion,
);
