import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';
import { existingAgreementCollection } from '../middlewares/agreementCollection.validator.js';
import { existingSelectedAgreementVersion } from '../middlewares/agreementVersion.validator.js';
import {
    validateCreateEvolutiveStateTasksRequest,
    validateGenerateEvolutiveStatesBody,
    validateCreateConsolidationStateTasksRequest,
    validateGenerateConsolidatedStatesBody,
    validateGenerateStatesBody,
    validateSearchStatesBody,
} from '../middlewares/state.validator.js';
import { validateDirectorHealth } from '../middlewares/director.validator.js';
import {
    checkServiceAuthentication,
    checkUserAuthentication,
    hasSystemRole,
} from '../middlewares/authenticator.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';
import { SystemRole } from '../types/systemRole.js';

export const stateRoutes = Router();

const consolidationStateTasksPath =
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/tasks/states/consolidated';

const evolutiveStateTasksPath =
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/tasks/states/evolutive';

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/generate',
    checkUserAuthentication,
    hasSystemRole(SystemRole.SUPERADMIN),
    validateComputerHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateGenerateStatesBody,
    stateController.generateStatesForAgreementVersion,
);

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/consolidated/generate',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateComputerHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateGenerateConsolidatedStatesBody,
    stateController.generateConsolidatedStatesForAgreementVersion,
);

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/evolutive/generate',
    checkServiceAuthentication,
    validateComputerHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateGenerateEvolutiveStatesBody,
    stateController.generateEvolutiveStatesForAgreementVersion,
);

stateRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/search',
    checkServiceAuthentication,
    validateSearchStatesBody,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.searchStatesForAgreementVersion,
);

stateRoutes.post(
    consolidationStateTasksPath,
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateCreateConsolidationStateTasksRequest,
    stateController.createConsolidationStateTasksForAgreementVersion,
);

stateRoutes.get(
    consolidationStateTasksPath,
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.getConsolidationStateTasksForAgreementVersion,
);

stateRoutes.delete(
    consolidationStateTasksPath,
    checkServiceAuthentication,
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.deleteConsolidationStateTasksForAgreementVersion,
);

stateRoutes.post(
    evolutiveStateTasksPath,
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    validateCreateEvolutiveStateTasksRequest,
    stateController.createEvolutiveStateTasksForAgreementVersion,
);

stateRoutes.get(
    evolutiveStateTasksPath,
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.getEvolutiveStateTasksForAgreementVersion,
);

stateRoutes.delete(
    evolutiveStateTasksPath,
    checkServiceAuthentication,
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    stateController.deleteEvolutiveStateTasksForAgreementVersion,
);
