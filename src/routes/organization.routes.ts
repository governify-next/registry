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

export const organizationRoutes = Router();

// Organización
organizationRoutes.post(
    '/organizations/',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    validateOrganization,
    organizationController.createOrganization,
);
organizationRoutes.get('/organizations/', isAuthenticated, organizationController.getOrganizations);
organizationRoutes.get(
    '/organizations/:orgName',
    isAuthenticated,
    existingOrganization,
    organizationController.getOrganizationByName,
);
organizationRoutes.put(
    '/organizations/:orgName',
    isAuthenticated,
    hasOrgRole('admin'),
    validateOrganization,
    organizationController.updateOrganization,
);
organizationRoutes.delete(
    '/organizations/:orgName',
    isAuthenticated,
    hasOrgRole('admin'),
    organizationController.deleteOrganization,
);

// Roles
organizationRoutes.post(
    '/organizations/:orgName/roles',
    isAuthenticated,
    hasOrgRole('admin'),
    validateRole,
    uniqueRole,
    maxRoles,
    organizationController.addRole,
);
organizationRoutes.put(
    '/organizations/:orgName/roles/:roleName',
    isAuthenticated,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole('params'),
    validateRole,
    uniqueRole,
    organizationController.updateRole,
);
organizationRoutes.delete(
    '/organizations/:orgName/roles/:roleName',
    isAuthenticated,
    hasOrgRole('admin'),
    notAdminRole,
    existingRole('params'),
    organizationController.deleteRole,
);

// ElementFields
organizationRoutes.post(
    '/organizations/:orgName/elementFields',
    isAuthenticated,
    hasOrgRole('admin'),
    validateField,
    uniqueField('elementFields'),
    organizationController.addElementField,
);
organizationRoutes.put(
    '/organizations/:orgName/elementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('elementFields'),
    validateField,
    uniqueField('elementFields'),
    organizationController.updateElementField,
);
organizationRoutes.delete(
    '/organizations/:orgName/elementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('elementFields'),
    organizationController.deleteElementField,
);

// AgreementFields
organizationRoutes.post(
    '/organizations/:orgName/agreementFields',
    isAuthenticated,
    hasOrgRole('admin'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.addAgreementField,
);
organizationRoutes.put(
    '/organizations/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    validateField,
    uniqueField('agreementFields'),
    organizationController.updateAgreementField,
);
organizationRoutes.delete(
    '/organizations/:orgName/agreementFields/:fieldName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingField('agreementFields'),
    organizationController.deleteAgreementField,
);

// Org - Users
organizationRoutes.get(
    '/organizations/:orgName/members',
    isAuthenticated,
    hasOrgRole('admin'),
    validateExpand,
    organizationController.getMembers,
);
organizationRoutes.post(
    '/organizations/:orgName/members',
    isAuthenticated,
    hasOrgRole('admin'),
    validateUsername,
    existingMembership(false, 'body'),
    maxMembers,
    organizationController.addUserToOrganization,
);

organizationRoutes.delete(
    '/organizations/:orgName/members/:username',
    isAuthenticated,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    notSelfRemoval,
    organizationController.removeUserFromOrganization,
);

// Org - User roles
organizationRoutes.post(
    '/organizations/:orgName/members/:username/roles',
    isAuthenticated,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    existingRole('body'),
    organizationController.addRoleToUser,
);

organizationRoutes.delete(
    '/organizations/:orgName/members/:username/roles/:roleName',
    isAuthenticated,
    hasOrgRole('admin'),
    existingMembership(true, 'params'),
    existingRole('params'),
    organizationController.removeRoleFromUser,
);
