import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import { validateOrganization } from '../middlewares/organization.validator.js';

export const organizationRoutes = Router();

organizationRoutes.post('/', validateOrganization, organizationController.createOrganization);
organizationRoutes.get('/', organizationController.getOrganizations);
organizationRoutes.get('/:orgId', organizationController.getOrganizationById);
organizationRoutes.put('/:orgId', validateOrganization, organizationController.updateOrganization);
organizationRoutes.delete('/:orgId', organizationController.deleteOrganization);
