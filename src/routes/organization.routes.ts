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
import { existingUser, validateUsername } from '../middlewares/user.validator.js';
import {
    existingMembership,
    maxMembers,
    notSelfRemoval,
} from '../middlewares/membership.validator.js';

const router = Router();
export const organizationRoutes = Router();
organizationRoutes.use('/api/v1/organizations', router);

// Organización
router.post(
    '/',
    isAuthenticated,
    hasRole('ADMIN'),
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
    existingOrganization,
    hasOrgRole('admin'),
    validateOrganization,
    organizationController.updateOrganization,
);
router.delete(
    '/:orgName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    organizationController.deleteOrganization,
);

// Roles
router.post(
    '/:orgName/roles',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    validateRole,
    uniqueRole,
    maxRoles,
    organizationController.addRole,
);
router.put(
    '/:orgName/roles/:roleName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole,
    validateRole,
    uniqueRole,
    organizationController.updateRole,
);
router.delete(
    '/:orgName/roles/:roleName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole,
    organizationController.deleteRole,
);

// ElementFields
router.post(
    '/:orgName/elementFields',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    validateField,
    uniqueField('elementFields'),
    organizationController.addElementField,
);
router.put(
    '/:orgName/elementFields/:fieldName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('elementFields'),
    validateField,
    uniqueField('elementFields'),
    organizationController.updateElementField,
);
router.delete(
    '/:orgName/elementFields/:fieldName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('elementFields'),
    organizationController.deleteElementField,
);

// AgreementFields
router.post(
    '/:orgName/agreementFields',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.addAgreementField,
);
router.put(
    '/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.updateAgreementField,
);
router.delete(
    '/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    organizationController.deleteAgreementField,
);

// Org - Users
router.post(
    '/:orgName/members',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    validateUsername,
    existingUser('body'),
    existingMembership(false),
    maxMembers,
    organizationController.addUserToOrganization,
);

router.delete(
    '/:orgName/members/:username',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingUser('params'),
    existingMembership(true),
    notSelfRemoval,
    organizationController.removeUserFromOrganization,
);

// Org - User roles
router.post(
    '/:orgName/members/:username/roles',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingUser('params'),
    existingMembership(true),
    existingRole('body'),
    organizationController.addRoleToUser,
);

router.delete(
    '/:orgName/members/:username/roles/:roleName',
    isAuthenticated,
    existingOrganization,
    hasOrgRole('admin'),
    existingUser('params'),
    existingMembership(true),
    existingRole('params'),
    organizationController.removeRoleFromUser,
);
