import { Router } from 'express';
import * as elementController from '../controllers/element.controller.js';
import { validateElement } from '../middlewares/element.validator.js';

export const elementRoutes = Router({ mergeParams: true });

elementRoutes.post('/', validateElement, elementController.createElement);
elementRoutes.get('/', elementController.getElementsByOrganization);
elementRoutes.get('/:elementName', elementController.getElementByName);
elementRoutes.put('/:elementName', validateElement, elementController.updateElement);
elementRoutes.delete('/:elementName', elementController.deleteElement);
