import { Router } from 'express';
import * as agreementCollectionController from '../controllers/agreementCollection.controller.js';
import {
    validateCreateAgreementCollection,
    validateUpdateAgreementCollection,
    validateCountAgreementCollections,
    validateUpdateAgreementCollectionPermissions,
    validateRemoveRoleFromAgreementCollectionPermissions,
    existingAgreementCollectionById,
    hasCollectionPermission,
} from '../middlewares/agreementCollection.validator.js';
import { CollectionPermission } from '../types/collectionPermission.types.js';
import { existingScope } from '../middlewares/scope.validator.js';
import {
    existingOrganization,
    isOrganizationAdmin,
} from '../middlewares/organization.validator.js';
import {
    checkServiceAuthentication,
    checkUserAuthentication,
} from '../middlewares/authenticator.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';

export const agreementCollectionRoutes = Router();

agreementCollectionRoutes.post(
    '/agreementCollections/count',
    checkServiceAuthentication,
    validateCountAgreementCollections,
    agreementCollectionController.countAgreementCollectionsByScopeIds,
);

agreementCollectionRoutes.delete(
    '/agreementCollections/permissions/roles/:roleId',
    checkServiceAuthentication,
    validateRemoveRoleFromAgreementCollectionPermissions,
    agreementCollectionController.removeRoleFromAgreementCollectionPermissions,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingOrganization,
    agreementCollectionController.getAgreementCollectionsByOrganization,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections/:agColId',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    existingOrganization,
    existingAgreementCollectionById,
    hasCollectionPermission(CollectionPermission.VIEW),
    agreementCollectionController.getAgreementCollectionById,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/agreementCollections/:agColId/permissions',
    checkUserAuthentication,
    existingOrganization,
    isOrganizationAdmin,
    existingAgreementCollectionById,
    agreementCollectionController.getAgreementCollectionPermissionsById,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/agreementCollections/:agColId/permissions',
    checkUserAuthentication,
    existingOrganization,
    isOrganizationAdmin,
    existingAgreementCollectionById,
    validateUpdateAgreementCollectionPermissions,
    agreementCollectionController.updateAgreementCollectionPermissionsById,
);

agreementCollectionRoutes.put(
    '/organizations/:orgName/agreementCollections/:agColId',
    checkUserAuthentication,
    existingOrganization,
    existingAgreementCollectionById,
    hasCollectionPermission(CollectionPermission.EDIT),
    validateUpdateAgreementCollection,
    agreementCollectionController.updateAgreementCollectionById,
);

agreementCollectionRoutes.delete(
    '/organizations/:orgName/agreementCollections/:agColId',
    checkServiceAuthentication,
    existingOrganization,
    existingAgreementCollectionById,
    hasCollectionPermission(CollectionPermission.DELETE),
    agreementCollectionController.deleteAgreementCollectionById,
);

agreementCollectionRoutes.get(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections',
    checkServiceAuthentication,
    existingScope,
    agreementCollectionController.getAgreementCollectionsByScope,
);

agreementCollectionRoutes.post(
    '/organizations/:orgName/scopes/:scopeId/agreementCollections',
    checkServiceAuthentication,
    existingScope,
    validateCreateAgreementCollection,
    agreementCollectionController.createAgreementCollectionByScope,
);
