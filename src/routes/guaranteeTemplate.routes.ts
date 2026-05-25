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

export const guaranteeTemplateRoutes = Router();

guaranteeTemplateRoutes.get(
    '/guaranteeTemplates',
    guaranteeTemplateController.getGuaranteeTemplates,
);

guaranteeTemplateRoutes.get(
    '/guaranteeTemplates/:guaranteeName',
    existingGuaranteeTemplate,
    guaranteeTemplateController.getGuaranteeTemplate,
);

guaranteeTemplateRoutes.post(
    '/guaranteeTemplates',
    validateComputerHealth,
    validateFetcherHealth,
    validateCreateGuaranteeTemplate,
    guaranteeTemplateController.createGuaranteeTemplate,
);

guaranteeTemplateRoutes.put(
    '/guaranteeTemplates/:guaranteeName',
    validateComputerHealth,
    validateFetcherHealth,
    validateUpdateGuaranteeTemplate,
    guaranteeTemplateController.updateGuaranteeTemplate,
);

guaranteeTemplateRoutes.delete(
    '/guaranteeTemplates/:guaranteeName',
    validateDeleteGuaranteeTemplate,
    guaranteeTemplateController.deleteGuaranteeTemplate,
);
