import { Router } from 'express';
import * as stateController from '../controllers/state.controller.js';

export const stateRoutes = Router();

stateRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/states/generate',
    stateController.generateStatesForAuditableVersion,
);

stateRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion/states',
    stateController.getStatesForAuditableVersion,
);
