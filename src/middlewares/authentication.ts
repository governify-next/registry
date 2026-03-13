import jwt from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../utils/customErrors.js';
import { type Request, type Response, type NextFunction } from 'express';
import { Types } from 'mongoose';
import { getLogger } from '../utils/logger.js';

const logger = getLogger().setTag('authentication.ts');

export interface AuthenticatedRequest extends Request {
    auth: UserJwtPayload;
}

export interface UserJwtPayload {
    userId: Types.ObjectId;
    username: string;
    systemRole: 'ADMIN' | 'USER';
}

export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authorization header missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserJwtPayload;

        req.auth = decoded; // Attach UserJwtPayload to AuthenticatedRequest
        next();
    } catch (err) {
        logger.debug('JWT verification failed', err);
        next(new UnauthorizedError('Invalid or expired token'));
    }
};

export const hasRole = (requiredRole: 'ADMIN' | 'USER') => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.auth) {
            return next(new UnauthorizedError('User not authenticated'));
        }

        const userRole = req.auth.systemRole;
        if (userRole !== requiredRole) {
            return next(new ForbiddenError('Insufficient permissions'));
        }

        next();
    };
};
