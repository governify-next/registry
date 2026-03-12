import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';

export const validateCreateUser = [
    body('username')
        .exists({ checkNull: true })
        .withMessage('Username is required')
        .isString()
        .withMessage('Username must be a string')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long')
        .isLength({ max: 50 })
        .withMessage('Username must be at most 50 characters long'),
    body('email')
        .exists({ checkNull: true })
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email must be valid'),
    body('password')
        .exists({ checkNull: true })
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('name')
        .exists({ checkNull: true })
        .withMessage('Name is required')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long')
        .isLength({ max: 30 })
        .withMessage('Name must be at most 30 characters long'),
    body('surname')
        .exists({ checkNull: true })
        .withMessage('Surname is required')
        .isString()
        .withMessage('Surname must be a string')
        .isLength({ min: 2 })
        .withMessage('Surname must be at least 2 characters long')
        .isLength({ max: 50 })
        .withMessage('Surname must be at most 50 characters long'),
    body('systemRole')
        .exists({ checkNull: true })
        .withMessage('System role is required')
        .isIn(['ADMIN', 'USER'])
        .withMessage('System role must be one of: ADMIN, USER'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];

export const validateLogin = [
    body('login')
        .exists({ checkNull: true })
        .withMessage('Login identifier (username or email) is required')
        .isString()
        .withMessage('Login identifier (username or email) must be a string')
        .isLength({ min: 3 })
        .withMessage('Login identifier (username or email) must be at least 3 characters long')
        .isLength({ max: 100 })
        .withMessage('Login identifier (username or email) must be at most 100 characters long'),
    body('password')
        .exists({ checkNull: true })
        .withMessage('Password is required')
        .isString()
        .withMessage('Password must be a string')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new ValidationError('Validation failed', errors.array()));
        }
        next();
    },
];
