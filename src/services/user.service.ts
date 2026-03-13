import * as userRepository from '../repositories/user.repository.js';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model.js';
import { UnauthorizedError } from '../utils/customErrors.js';

export const createUser = async (data: Partial<IUser>) => {
    return await userRepository.createUser(data);
};

export const getUsers = async () => {
    return await userRepository.getUsers();
};

export const getUserByUsername = async (username: string) => {
    return await userRepository.getUserByUsername(username);
};

export const updateUser = async (username: string, data: Partial<IUser>) => {
    return await userRepository.updateUser(username, data);
};

export const deleteUser = async (username: string) => {
    return await userRepository.deleteUser(username);
};

export const login = async (login: string, password: string) => {
    const user = await userRepository.findUserByLoginHandle(login);
    if (!user) throw new UnauthorizedError('Invalid login identifier');

    const isMatch = await user.validatePassword(password);
    if (!isMatch) throw new UnauthorizedError('Invalid password');

    const { username, systemRole } = user;
    const userId = user._id;

    return jwt.sign(
        { userId, username, systemRole }, // TODO: add organization scopes
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' },
    );
};
