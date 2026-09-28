import { body, type Meta } from 'express-validator';
import { windowUnits } from '../types/window.types.js';

// Both guarantee windows have exactly the same structure and field constraints.
export const validateGuaranteeWindow = (field: 'window' | 'evolutiveWindow', nullable = false) => {
    const path = `guarantees.*.${field}`;
    const hasWindow = (_value: unknown, { req, pathValues }: Meta) =>
        !nullable || req.body.guarantees?.[String(pathValues[0])]?.[field] !== null;
    return [
        body(path)
            .exists()
            .withMessage('Each guarantee entry must have a window object')
            .bail()
            .if(hasWindow)
            .isObject()
            .withMessage('window must be an object'),
        body(`${path}.anchorDate`)
            .if(hasWindow)
            .exists({ checkNull: true })
            .withMessage('Each window must have an anchorDate')
            .isISO8601()
            .withMessage('anchorDate must be a valid ISO8601 string')
            .isAfter('2000-01-01T00:00:00.000Z')
            .isBefore('2100-01-01T00:00:00.000Z')
            .withMessage('anchorDate must be a realistic Date (between year 2000 and 2100)'),
        body(`${path}.period`)
            .if(hasWindow)
            .exists({ checkNull: true })
            .withMessage('Each window must have a period array')
            .isArray({ min: 1 })
            .withMessage('period must be an array with at least one entry'),
        body(`${path}.period.*.unit`)
            .if(hasWindow)
            .exists({ checkNull: true })
            .withMessage('Each period entry must have a unit')
            .isIn(windowUnits)
            .withMessage(
                'Period unit must be one of: millisecond, second, minute, hour, day, week',
            ),
        body(`${path}.period.*.value`)
            .if(hasWindow)
            .exists({ checkNull: true })
            .withMessage('Each period entry must have a value')
            .isInt({ min: 1 })
            .withMessage('Period value must be a positive integer strictly greater than 0'),
    ];
};
