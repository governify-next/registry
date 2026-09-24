import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import GuaranteeTemplate from '../src/models/guaranteeTemplate.model.js';
import * as templates from '../src/services/agreementTemplate.service.js';
import { getGuaranteesByAgreementTemplateId } from '../src/repositories/guarantee.repository.js';
import type { IAgreementTemplatePayload } from '../src/types/agreementTemplate.types.js';

const fixture = async () => {
    const orgId = new Types.ObjectId();
    await GuaranteeTemplate.insertMany(
        ['ALPHA', 'MIDDLE', 'ZETA'].map((name) => ({
            name,
            info: { title: name },
            numericExpression: '1',
            metrics: [],
        })),
    );
    const input: IAgreementTemplatePayload = {
        name: 'template',
        displayName: 'Template',
        description: 'Test template',
        isPublic: true,
        guarantees: ['ZETA', 'ALPHA', 'MIDDLE'].map((guaranteeTemplateName) => ({
            guaranteeTemplateName,
            comparator: '>=',
            threshold: 1,
            window: {
                period: [{ unit: 'day', value: 1 }],
                anchorDate: '2026-01-01T00:00:00Z',
            },
        })),
    };
    const template = await templates.createAgreementTemplateByOrganization(orgId, input);
    return { orgId, input, template };
};

describe('agreement template guarantee order', () => {
    it('persists the submitted order and returns it from all template readers', async () => {
        const { orgId, input, template } = await fixture();
        const expected = input.guarantees.map((g) => g.guaranteeTemplateName);
        const responses = [
            template,
            await templates.getAgreementTemplateByOrganization(orgId, input.name),
            ...(await templates.getAgreementTemplatesByOrganization(orgId)),
            ...(await templates.getPublicAgreementTemplates()),
        ];
        for (const response of responses) {
            expect(response.guarantees.map((g) => g.guaranteeTemplateName)).toEqual(expected);
            expect(response.guarantees.every((g) => !('position' in g))).toBe(true);
        }
        expect(
            (await getGuaranteesByAgreementTemplateId(template._id)).map((g) => g.position),
        ).toEqual([0, 1, 2]);
    });

    it('reassigns positions from the submitted array on update', async () => {
        const { orgId, input, template } = await fixture();
        input.guarantees.reverse();
        const updated = await templates.updateAgreementTemplateByOrganization(
            orgId,
            input.name,
            input,
        );
        expect(updated.guarantees.map((g) => g.guaranteeTemplateName)).toEqual([
            'MIDDLE',
            'ALPHA',
            'ZETA',
        ]);
        expect(
            (await getGuaranteesByAgreementTemplateId(template._id)).map((g) => g.position),
        ).toEqual([0, 1, 2]);
    });
});
