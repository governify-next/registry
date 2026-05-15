import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/customErrors.js';
import { type Request, type Response, type NextFunction } from 'express';
import { getLogger } from '../utils/logger.js';
import { bootEnv } from '../config/bootConfig.js';

const logger = getLogger().setTag('service.authenticator.ts');

const SERVICE_AUTHENTICATION_ENABLED = bootEnv.SERVICE_AUTHENTICATION_ENABLED;
const JWT_SECRET = bootEnv.JWT_SECRET;

declare module 'express' {
    interface Request {
        auth?: JwtPayload;
    }
}

export interface JwtPayload {
    service: string;
}

export const checkServiceAuthentication = (req: Request, res: Response, next: NextFunction) => {
    if (!SERVICE_AUTHENTICATION_ENABLED) {
        logger.debug(
            'Skipping authentication in development environment!! DO NOT USE IN PRODUCTION!!',
        );
        return next();
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authorization header missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        req.auth = decoded; // Attach JwtPayload to the Request for downstream use
        next();
    } catch (err) {
        logger.debug('JWT verification failed', err);
        next(new UnauthorizedError('Invalid or expired token'));
    }
};
