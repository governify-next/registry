import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import { existingScope } from '../middlewares/scope.validator.js';
import {
    existingAgreementCollection,
    hasCollectionPermission,
} from '../middlewares/agreementCollection.validator.js';
import { CollectionPermission } from '../types/collectionPermission.types.js';
import { existingSelectedAgreementVersion } from '../middlewares/agreementVersion.validator.js';
import {
    validateCreateEvolutiveStateTasksRequest,
    validateGenerateEvolutiveStatesBody,
    validateCreateConsolidationStateTasksRequest,
    validateGenerateConsolidatedStatesBody,
    validateGenerateStatesBody,
    validateSearchStatesBody,
    validateGetStateForAgreementVersion,
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
    hasCollectionPermission(CollectionPermission.TRACK_PERIOD),
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

stateRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections/:agColId/agreementVersions/:agreementVersion/states/:stateId',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    hasCollectionPermission(CollectionPermission.VIEW),
    validateGetStateForAgreementVersion,
    stateController.getStateForAgreementVersion,
);

stateRoutes.post(
    consolidationStateTasksPath,
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateDirectorHealth,
    existingScope,
    existingAgreementCollection,
    existingSelectedAgreementVersion,
    hasCollectionPermission(CollectionPermission.AUTO_TRACKING),
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
    hasCollectionPermission(CollectionPermission.VIEW),
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
    hasCollectionPermission(CollectionPermission.AUTO_TRACKING),
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
    hasCollectionPermission(CollectionPermission.VIEW),
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
