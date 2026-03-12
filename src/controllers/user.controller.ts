import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/standardResponse.js';
import { NotFoundError } from '../utils/customErrors.js';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.createUser(req.body);
        return sendSuccess(res, { data: user, httpStatus: 201, message: 'User created' });
    } catch (err) {
        next(err);
    }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getUsers();
        return sendSuccess(res, { data: users });
    } catch (err) {
        next(err);
    }
};

export const getUserByUsername = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserByUsername(req.params.username);
        if (!user) throw new NotFoundError('User not found');
        return sendSuccess(res, { data: user });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.updateUser(req.params.username, req.body);
        if (!user) throw new NotFoundError('User not found');
        return sendSuccess(res, { data: user, message: 'User updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.deleteUser(req.params.username);
        if (!user) throw new NotFoundError('User not found');
        return sendSuccess(res, { data: null, message: 'User deleted' });
    } catch (err) {
        next(err);
    }
};
