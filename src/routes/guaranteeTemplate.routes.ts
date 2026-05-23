import { Router } from 'express';
import * as guaranteeTemplateController from '../controllers/guaranteeTemplate.controller.js';
import {
    validateCreateGuaranteeTemplate,
    validateUpdateGuaranteeTemplate,
    validateDeleteGuaranteeTemplate,
    existingGuaranteeTemplate,
} from '../middlewares/guaranteeTemplate.validator.js';
import { validateComputerHealth } from '../middlewares/computer.validator.js';
import { validateCollectorHealth } from '../middlewares/collector.validator.js';

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
    validateCollectorHealth,
    validateCreateGuaranteeTemplate,
    guaranteeTemplateController.createGuaranteeTemplate,
);

guaranteeTemplateRoutes.put(
    '/guaranteeTemplates/:guaranteeName',
    validateComputerHealth,
    validateCollectorHealth,
    validateUpdateGuaranteeTemplate,
    guaranteeTemplateController.updateGuaranteeTemplate,
);

guaranteeTemplateRoutes.delete(
    '/guaranteeTemplates/:guaranteeName',
    validateDeleteGuaranteeTemplate,
    guaranteeTemplateController.deleteGuaranteeTemplate,
);
