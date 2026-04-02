import { Router } from 'express';
import * as agreementTemplateController from '../controllers/agreementTemplate.controller.js';
import {
    existingAgreementTemplate,
    validateCreateAgreementTemplate,
    validateUpdateAgreementTemplate,
} from '../middlewares/agreementTemplate.validator.js';
import { existingOrganization } from '../middlewares/organization.validator.js';

export const agreementTemplateRoutes = Router();

agreementTemplateRoutes.get(
    '/organizations/:orgName/agreementTemplates',
    existingOrganization,
    agreementTemplateController.getAgreementTemplatesByOrganization,
);

agreementTemplateRoutes.get(
    '/organizations/:orgName/agreementTemplates/:agreementTemplateName',
    existingAgreementTemplate((req) => req.params.agreementTemplateName),
    agreementTemplateController.getAgreementTemplateByOrganization,
);

agreementTemplateRoutes.post(
    '/organizations/:orgName/agreementTemplates',
    validateCreateAgreementTemplate,
    agreementTemplateController.createAgreementTemplateByOrganization,
);

agreementTemplateRoutes.put(
    '/organizations/:orgName/agreementTemplates/:agreementTemplateName',
    validateUpdateAgreementTemplate,
    agreementTemplateController.updateAgreementTemplateByOrganization,
);

agreementTemplateRoutes.delete(
    '/organizations/:orgName/agreementTemplates/:agreementTemplateName',
    existingAgreementTemplate((req) => req.params.agreementTemplateName),
    agreementTemplateController.deleteAgreementTemplateByOrganization,
);

agreementTemplateRoutes.get(
    '/agreementTemplates/public',
    agreementTemplateController.getPublicAgreementTemplates,
);
