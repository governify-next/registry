import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, ForbiddenError, LimitError } from '../utils/customErrors.js';
import { findMembership } from '../services/membership.service.js';
import { getOrganizationOrFail } from './organization.validator.js';
import Membership from '../models/membership.model.js';
import { getUserOrFail } from './user.validator.js';
import type { ExpandMode } from '../types/membership.types.js';

// Sincronizamos con el type definido para que el compilador avise si se actualiza
const VALID_EXPAND_VALUES: readonly string[] = ['none', 'full', 'names'] satisfies ExpandMode[];

export const existingMembership = (shouldExist: boolean, source: 'body' | 'params') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.orgName) return next(new ValidationError('Organization name is required'));
        const username = req[source].username;
        if (!username) return next(new ValidationError('Username is required'));

        try {
            const organization = await getOrganizationOrFail(req.params.orgName);
            const user = await getUserOrFail(username);

            const membership = await findMembership(organization._id, user._id);

            // Para añadir un usuario a una org, no debería existir ya
            if (membership && !shouldExist)
                return next(
                    new ValidationError(
                        `The user '${user.username}' already exists in organization '${organization.name}'`,
                    ),
                );
            // Para eliminar un usuario de una org, debería existir
            if (!membership && shouldExist)
                return next(
                    new ValidationError(
                        `The user '${user.username}' does not exist in organization '${organization.name}'`,
                    ),
                );

            next();
        } catch (err) {
            next(err);
        }
    };
};

export const maxMembers = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.orgName) return next(new ValidationError('Organization name is required'));

    try {
        const max = parseInt(process.env.MAX_MEMBERS_PER_ORGANIZATION || '1000', 10);
        const organization = await getOrganizationOrFail(req.params.orgName);
        const count = await Membership.countDocuments({ organizationId: organization._id });
        if (count >= max)
            return next(
                new LimitError(
                    `Organization '${organization.name}' has reached the maximum limit of ${max} members.`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

export const validateExpand = (req: Request, res: Response, next: NextFunction) => {
    const expand = req.query.expand as string | undefined;
    if (expand && !VALID_EXPAND_VALUES.includes(expand))
        return next(
            new ValidationError(
                `Invalid expand value. Must be one of: ${VALID_EXPAND_VALUES.join(', ')}`,
            ),
        );
    next();
};

// Como siempre tiene que existir un admin en la organización, impedimos que el usuario que hace
// la petición se elimine así mismo y así de paso cumplimos la validación
export const notSelfRemoval = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.username) return next(new ValidationError('Username is required'));
    try {
        const user = await getUserOrFail(req.params.username);
        if (req.auth!.userId.toString() === user._id.toString())
            return next(new ForbiddenError('You cannot remove yourself from the organization'));
        next();
    } catch (err) {
        next(err);
    }
};
