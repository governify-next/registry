import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';

export const stateRoutes = Router();

stateRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/states/generate',
    validateComputerHealth,
    stateController.generateStatesForAuditableVersion,
);

stateRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/states',
    stateController.getStatesForAuditableVersion,
);
