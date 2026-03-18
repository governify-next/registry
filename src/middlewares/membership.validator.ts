import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError, ForbiddenError, LimitError } from '../utils/customErrors.js';
import { findMembership } from '../services/membership.service.js';
import Membership from '../models/membership.model.js';

export const existingMembership = (shouldExist: boolean) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.targetUser!._id;
            const organizationId = req.organization!._id;

            const membership = await findMembership(organizationId, userId);

            // Para añadir un usuario a una org, no debería existir ya
            if (membership && !shouldExist)
                return next(
                    new ValidationError(
                        `The user '${req.targetUser!.username}' already exists in organization '${req.organization!.name}'`,
                    ),
                );
            // Para eliminar un usuario de una org, debería existir
            if (!membership && shouldExist)
                return next(
                    new ValidationError(
                        `The user '${req.targetUser!.username}' does not exist in organization '${req.organization!.name}'`,
                    ),
                );

            next();
        } catch (err) {
            next(err);
        }
    };
};

export const maxMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const max = parseInt(process.env.MAX_MEMBERS_PER_ORGANIZATION || '1000', 10);
        const count = await Membership.countDocuments({ organizationId: req.organization!._id });
        if (count >= max)
            return next(
                new LimitError(
                    `Organization '${req.organization!.name}' has reached the maximum limit of ${max} members.`,
                ),
            );
        next();
    } catch (err) {
        next(err);
    }
};

// Como siempre tiene que existir un admin en la organización, impedimos que el usuario que hace
// la petición se elimine así mismo y así de paso cumplimos la validación
export const notSelfRemoval = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.auth!.userId.toString() === req.targetUser!._id.toString())
            return next(new ForbiddenError('You cannot remove yourself from the organization'));
        next();
    } catch (err) {
        next(err);
    }
};
