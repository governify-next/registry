import { Router } from 'express';
import * as agreementTemplateController from '../controllers/agreementTemplate.controller.js';
import {} from '../middlewares/agreementTemplate.validator.js';

export const agreementTemplateRoutes = Router();

agreementTemplateRoutes.get(
    '/organizations/:orgName/agreementTemplates',
    agreementTemplateController.getAgreementTemplatesByOrganization,
);

agreementTemplateRoutes.get(
    '/organizations/:orgName/agreementTemplates/:agreementTemplateName',
    agreementTemplateController.getAgreementTemplateByOrganization,
);

agreementTemplateRoutes.post(
    '/organizations/:orgName/agreementTemplates',
    agreementTemplateController.createAgreementTemplateByOrganization,
);

agreementTemplateRoutes.put(
    '/organizations/:orgName/agreementTemplates/:agreementTemplateName',
    agreementTemplateController.updateAgreementTemplateByOrganization,
);

agreementTemplateRoutes.delete(
    '/organizations/:orgName/agreementTemplates/:agreementTemplateName',
    agreementTemplateController.deleteAgreementTemplateByOrganization,
);

agreementTemplateRoutes.get(
    '/agreementTemplates/public',
    agreementTemplateController.getPublicAgreementTemplates,
);
