import { Router } from 'express';
import * as guaranteeTemplateController from '../controllers/guaranteeTemplate.controller.js';

export const guaranteeTemplateRoutes = Router();

guaranteeTemplateRoutes.get(
    '/guaranteeTemplates',
    guaranteeTemplateController.getGuaranteeTemplates,
);

guaranteeTemplateRoutes.get(
    '/guaranteeTemplates/:guaranteeName',
    guaranteeTemplateController.getGuaranteeTemplate,
);

guaranteeTemplateRoutes.post(
    '/guaranteeTemplates',
    guaranteeTemplateController.createGuaranteeTemplate,
);

guaranteeTemplateRoutes.put(
    '/guaranteeTemplates/:guaranteeName',
    guaranteeTemplateController.updateGuaranteeTemplate,
);

guaranteeTemplateRoutes.delete(
    '/guaranteeTemplates/:guaranteeName',
    guaranteeTemplateController.deleteGuaranteeTemplate,
);
