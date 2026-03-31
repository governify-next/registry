import { Router } from 'express';
import * as agreementVersionController from '../controllers/agreementVersion.controller.js';

export const agreementVersionRoutes = Router();

agreementVersionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions',
    agreementVersionController.getAgreementVersionsByCollection,
);

agreementVersionRoutes.get(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/auditableVersion',
    agreementVersionController.getAuditableVersionByCollection,
);

agreementVersionRoutes.delete(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/:versionNumber',
    agreementVersionController.deleteAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions',
    agreementVersionController.createAgreementVersionByCollection,
);

agreementVersionRoutes.post(
    '/organizations/:orgName/elements/:elementName/agreementCollections/:agColName/agreementVersions/activeVersion/terminate',
    agreementVersionController.terminateActiveVersion,
);
