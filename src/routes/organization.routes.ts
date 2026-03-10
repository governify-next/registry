import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import { validateOrganization, validateRole } from '../middlewares/organization.validator.js';

export const organizationRoutes = Router();

// Organización
organizationRoutes.post('/', validateOrganization, organizationController.createOrganization);
organizationRoutes.get('/', organizationController.getOrganizations);
organizationRoutes.get('/:orgName', organizationController.getOrganizationByName);
organizationRoutes.put(
    '/:orgName',
    validateOrganization,
    organizationController.updateOrganization,
);
organizationRoutes.delete('/:orgName', organizationController.deleteOrganization);

// Roles
organizationRoutes.post('/:orgName/roles', validateRole, organizationController.addRole);
