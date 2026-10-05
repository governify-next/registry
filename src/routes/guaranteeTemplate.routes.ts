import { Router } from 'express';
import * as guaranteeTemplateController from '../controllers/guaranteeTemplate.controller.js';
import {
    validateCreateGuaranteeTemplate,
    validateUpdateGuaranteeTemplate,
    validateDeleteGuaranteeTemplate,
    existingGuaranteeTemplate,
} from '../middlewares/guaranteeTemplate.validator.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import { validateFetcherHealth } from '../middlewares/fetcher.validator.js';
import { checkServiceAuthentication } from '../middlewares/authenticator.validator.js';

export const guaranteeTemplateRoutes = Router();

guaranteeTemplateRoutes.get(
    '/guaranteeTemplates',
    checkServiceAuthentication,
    guaranteeTemplateController.getGuaranteeTemplates,
);

guaranteeTemplateRoutes.get(
    '/guaranteeTemplates/:guaranteeName',
    checkServiceAuthentication,
    existingGuaranteeTemplate,
    guaranteeTemplateController.getGuaranteeTemplate,
);

guaranteeTemplateRoutes.post(
    '/guaranteeTemplates',
    checkServiceAuthentication,
    validateComputerHealth,
    validateFetcherHealth,
    validateCreateGuaranteeTemplate,
    guaranteeTemplateController.createGuaranteeTemplate,
);

guaranteeTemplateRoutes.put(
    '/guaranteeTemplates/:guaranteeName',
    checkServiceAuthentication,
    validateComputerHealth,
    validateFetcherHealth,
    validateUpdateGuaranteeTemplate,
    guaranteeTemplateController.updateGuaranteeTemplate,
);

guaranteeTemplateRoutes.delete(
    '/guaranteeTemplates/:guaranteeName',
    checkServiceAuthentication,
    validateDeleteGuaranteeTemplate,
    guaranteeTemplateController.deleteGuaranteeTemplate,
);
