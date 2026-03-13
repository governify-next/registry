import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validateCreateUser, validateLogin } from '../middlewares/user.validator.js';
import { isAuthenticated, hasRole } from '../middlewares/authentication.js';

export const userRoutes = Router();

userRoutes.get('/', isAuthenticated, hasRole('ADMIN'), userController.getUsers);

userRoutes.get('/:username', isAuthenticated, hasRole('ADMIN'), userController.getUserByUsername);

userRoutes.post(
    '/',
    isAuthenticated,
    hasRole('ADMIN'),
    validateCreateUser,
    userController.createUser,
);

userRoutes.put(
    '/:username',
    isAuthenticated,
    hasRole('ADMIN'),
    validateCreateUser,
    userController.updateUser,
);

userRoutes.delete('/:username', isAuthenticated, hasRole('ADMIN'), userController.deleteUser);

userRoutes.post('/login', validateLogin, userController.login);
