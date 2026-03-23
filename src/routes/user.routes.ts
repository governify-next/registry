import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validateCreateUser, validateLogin } from '../middlewares/user.validator.js';
import { isAuthenticated, hasRole } from '../middlewares/authentication.js';
import { SystemRole } from '../types/systemRole.js';

export const userRoutes = Router();

userRoutes.get('/', isAuthenticated, hasRole(SystemRole.ADMIN), userController.getUsers);

userRoutes.get(
    '/:username',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    userController.getUserByUsername,
);

userRoutes.post(
    '/',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    validateCreateUser,
    userController.createUser,
);

userRoutes.put(
    '/:username',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    validateCreateUser,
    userController.updateUser,
);

userRoutes.delete(
    '/:username',
    isAuthenticated,
    hasRole(SystemRole.ADMIN),
    userController.deleteUser,
);

userRoutes.post('/login', validateLogin, userController.login);
