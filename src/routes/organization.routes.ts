import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import {
    validateOrganization,
    validateRole,
    validateField,
} from '../middlewares/organization.validator.js';

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
organizationRoutes.put(
    '/:orgName/roles/:roleName',
    validateRole,
    organizationController.updateRole,
);
organizationRoutes.delete('/:orgName/roles/:roleName', organizationController.deleteRole);

// ElementFields
organizationRoutes.post(
    '/:orgName/elementFields',
    validateField,
    organizationController.addElementField,
);
organizationRoutes.put(
    '/:orgName/elementFields/:fieldName',
    validateField,
    organizationController.updateElementField,
);
organizationRoutes.delete(
    '/:orgName/elementFields/:fieldName',
    organizationController.deleteElementField,
);

// AgreementFields
organizationRoutes.post(
    '/:orgName/agreementFields',
    validateField,
    organizationController.addAgreementField,
);
organizationRoutes.put(
    '/:orgName/agreementFields/:fieldName',
    validateField,
    organizationController.updateAgreementField,
);
organizationRoutes.delete(
    '/:orgName/agreementFields/:fieldName',
    organizationController.deleteAgreementField,
);
