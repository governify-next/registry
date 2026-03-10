import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import {
    validateOrganization,
    existingOrganization,
} from '../middlewares/organization.validator.js';
import { elementRoutes } from './element.routes.js';

export const organizationRoutes = Router();

organizationRoutes.post('/', validateOrganization, organizationController.createOrganization);
organizationRoutes.get('/', organizationController.getOrganizations);
organizationRoutes.get('/:orgName', organizationController.getOrganizationByName);
organizationRoutes.put(
    '/:orgName',
    validateOrganization,
    organizationController.updateOrganization,
);
organizationRoutes.delete('/:orgName', organizationController.deleteOrganization);

organizationRoutes.use('/:orgName/elements', existingOrganization, elementRoutes);
