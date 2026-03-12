import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validateCreateUser } from '../middlewares/user.validator.js';

export const userRoutes = Router();

userRoutes.get('/', userController.getUsers);
userRoutes.get('/:username', userController.getUserByUsername);
userRoutes.post('/', validateCreateUser, userController.createUser);
userRoutes.put('/:username', validateCreateUser, userController.updateUser);
userRoutes.delete('/:username', userController.deleteUser);
