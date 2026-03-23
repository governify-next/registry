import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import {
    validateOrganization,
    validateRole,
    validateField,
    existingOrganization,
    existingRole,
    existingField,
    uniqueRole,
    maxRoles,
    uniqueField,
    hasOrgRole,
    notAdminRole,
} from '../middlewares/organization.validator.js';
import { hasRole, isAuthenticated } from '../middlewares/authentication.js';
import { validateUsername } from '../middlewares/user.validator.js';
import {
    existingMembership,
    maxMembers,
    notSelfRemoval,
    validateExpand,
} from '../middlewares/membership.validator.js';
import { SystemRole } from '../types/systemRole.js';
import { elementRoutes } from './element.routes.js';

const router = Router();
export const organizationRoutes = Router();
organizationRoutes.use('/api/v1/organizations', router);

// Organización
router.post(
    '/',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    validateOrganization,
    organizationController.createOrganization,
);
router.get('/', isAuthenticated, organizationController.getOrganizations);
router.get(
    '/:orgName',
    isAuthenticated,
    existingOrganization,
    organizationController.getOrganizationByName,
);
router.put(
    '/:orgName',
    isAuthenticated,
    hasOrgRole('admin'),
    validateOrganization,
    organizationController.updateOrganization,
);
router.delete(
    '/:orgName',
    isAuthenticated,
    hasOrgRole('admin'),
    organizationController.deleteOrganization,
);

// Roles
router.post(
    '/:orgName/roles',
    isAuthenticated,
    hasOrgRole('admin'),
    validateRole,
    uniqueRole,
    maxRoles,
    organizationController.addRole,
);
router.put(
    '/:orgName/roles/:roleName',
    isAuthenticated,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole('params'),
    validateRole,
    uniqueRole,
    organizationController.updateRole,
);
router.delete(
    '/:orgName/roles/:roleName',
    isAuthenticated,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole('params'),
    organizationController.deleteRole,
);

// ElementFields
router.post(
    '/:orgName/elementFields',
    isAuthenticated,
    hasOrgRole('admin'),
    validateField,
    uniqueField('elementFields'),
    organizationController.addElementField,
);
router.put(
    '/:orgName/elementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('elementFields'),
    validateField,
    uniqueField('elementFields'),
    organizationController.updateElementField,
);
router.delete(
    '/:orgName/elementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('elementFields'),
    organizationController.deleteElementField,
);

// AgreementFields
router.post(
    '/:orgName/agreementFields',
    isAuthenticated,
    hasOrgRole('admin'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.addAgreementField,
);
router.put(
    '/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.updateAgreementField,
);
router.delete(
    '/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    organizationController.deleteAgreementField,
);

// Org - Users
router.get(
    '/:orgName/members',
    isAuthenticated,
    hasOrgRole('admin'),
    validateExpand,
    organizationController.getMembers,
);
router.post(
    '/:orgName/members',
    isAuthenticated,
    hasOrgRole('admin'),
    validateUsername,
    existingMembership(false, 'body'),
    maxMembers,
    organizationController.addUserToOrganization,
);

router.delete(
    '/:orgName/members/:username',
    isAuthenticated,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    notSelfRemoval,
    organizationController.removeUserFromOrganization,
);

// Org - User roles
router.post(
    '/:orgName/members/:username/roles',
    isAuthenticated,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    existingRole('body'),
    organizationController.addRoleToUser,
);

router.delete(
    '/:orgName/members/:username/roles/:roleName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    existingRole('params'),
    organizationController.removeRoleFromUser,
);

organizationRoutes.use('/:orgName/elements', existingOrganization, elementRoutes);
