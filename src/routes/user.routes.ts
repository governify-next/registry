import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validateCreateUser, validateLogin } from '../middlewares/user.validator.js';
import { isAuthenticated, hasRole } from '../middlewares/authentication.js';
import { SystemRole } from '../types/systemRole.js';

export const userRoutes = Router();

userRoutes.get('/users/', isAuthenticated, hasRole(SystemRole.ADMIN), userController.getUsers);

userRoutes.get(
    '/users/:username',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    userController.getUserByUsername,
);

userRoutes.post('/users/', validateCreateUser, userController.createUser);

userRoutes.put(
    '/users/:username',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    validateCreateUser,
    userController.updateUser,
);

userRoutes.delete(
    '/users/:username',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    userController.deleteUser,
);

userRoutes.post('/users/login', validateLogin, userController.login);
