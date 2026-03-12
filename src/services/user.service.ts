import * as userRepository from '../repositories/user.repository.js';
import { IUser } from '../models/user.model.js';

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

export const login = async (username: string, password: string) => {
    return await userRepository.login(username, password);
};
