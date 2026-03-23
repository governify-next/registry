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
    hasOrgRole(SystemRole.ADMIN),
    validateOrganization,
    organizationController.updateOrganization,
);
router.delete(
    '/:orgName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    organizationController.deleteOrganization,
);

// Roles
router.post(
    '/:orgName/roles',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    validateRole,
    uniqueRole,
    maxRoles,
    organizationController.addRole,
);
router.put(
    '/:orgName/roles/:roleName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    notAdminRole,
    existingRole('params'),
    validateRole,
    uniqueRole,
    organizationController.updateRole,
);
router.delete(
    '/:orgName/roles/:roleName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    notAdminRole,
    existingRole('params'),
    organizationController.deleteRole,
);

// ElementFields
router.post(
    '/:orgName/elementFields',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    validateField,
    uniqueField('elementFields'),
    organizationController.addElementField,
);
router.put(
    '/:orgName/elementFields/:fieldName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingField('elementFields'),
    validateField,
    uniqueField('elementFields'),
    organizationController.updateElementField,
);
router.delete(
    '/:orgName/elementFields/:fieldName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingField('elementFields'),
    organizationController.deleteElementField,
);

// AgreementFields
router.post(
    '/:orgName/agreementFields',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    validateField,
    uniqueField('agreementFields'),
    organizationController.addAgreementField,
);
router.put(
    '/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingField('agreementFields'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.updateAgreementField,
);
router.delete(
    '/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingField('agreementFields'),
    organizationController.deleteAgreementField,
);

// Org - Users
router.get(
    '/:orgName/members',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    validateExpand,
    organizationController.getMembers,
);
router.post(
    '/:orgName/members',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    validateUsername,
    existingMembership(false, 'body'),
    maxMembers,
    organizationController.addUserToOrganization,
);

router.delete(
    '/:orgName/members/:username',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingMembership(true, 'params'),
    notSelfRemoval,
    organizationController.removeUserFromOrganization,
);

// Org - User roles
router.post(
    '/:orgName/members/:username/roles',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingMembership(true, 'params'),
    existingRole('body'),
    organizationController.addRoleToUser,
);

router.delete(
    '/:orgName/members/:username/roles/:roleName',
    isAuthenticated,
    hasOrgRole(SystemRole.ADMIN),
    existingMembership(true, 'params'),
    existingRole('params'),
    organizationController.removeRoleFromUser,
);
