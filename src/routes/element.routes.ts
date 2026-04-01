import { Router } from 'express';
import * as elementController from '../controllers/element.controller.js';
import { validateElement, validateElementPart } from '../middlewares/element.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';

export const elementRoutes = Router();

elementRoutes.post(
    '/organizations/:orgName/elements',
    existingOrganization,
    validateElement,
    elementController.createElement,
);
elementRoutes.get(
    '/organizations/:orgName/elements',
    existingOrganization,
    elementController.getElementsByOrganization,
);
elementRoutes.get(
    '/organizations/:orgName/elements/:elementName',
    existingOrganization,
    elementController.getElementByName,
);
elementRoutes.put(
    '/organizations/:orgName/elements/:elementName',
    existingOrganization,
    validateElement,
    elementController.updateElement,
);
elementRoutes.delete(
    '/organizations/:orgName/elements/:elementName',
    existingOrganization,
    elementController.deleteElement,
);

elementRoutes.get(
    '/organizations/:orgName/elements/:elementName/parts',
    existingOrganization,
    elementController.getElementParts,
);

elementRoutes.post(
    '/organizations/:orgName/elements/:elementName/parts',
    existingOrganization,
    validateElementPart,
    elementController.addElementPart,
);

elementRoutes.post(
    '/organizations/:orgName/elements/:elementName/permissions/:permissionName',
    existingOrganization,
    elementController.addRoleToElementPermission,
);
