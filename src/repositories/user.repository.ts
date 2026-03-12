import User, { IUser } from '../models/user.model.js';

import { DuplicateKeyError } from '../utils/customErrors.js';

export const createUser = async (data: Partial<IUser>) => {
    try {
        const user = new User(data);
        return await user.save();
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { email?: number; username?: number };
            keyValue?: unknown;
            message?: string;
        };

        if (e.code === 11000) {
            if (e.keyPattern?.email) {
                throw new DuplicateKeyError(
                    'A user with that email already exists',
                    e.keyValue || e.message,
                );
            } else if (e.keyPattern?.username) {
                throw new DuplicateKeyError(
                    'A user with that username already exists',
                    e.keyValue || e.message,
                );
            }
        }
        throw err;
    }
};

export const getUsers = async () => {
    return await User.find();
};

export const getUserByUsername = async (username: string) => {
    return await User.findOne({ username });
};

export const updateUser = async (username: string, data: Partial<IUser>) => {
    try {
        return await User.findOneAndUpdate({ username }, data, { new: true });
    } catch (err) {
        const e = err as {
            code?: number;
            keyPattern?: { email?: number; username?: number };
            keyValue?: unknown;
            message?: string;
        };
        if (e.code === 11000) {
            if (e.keyPattern?.email) {
                throw new DuplicateKeyError(
                    'A user with that email already exists',
                    e.keyValue || e.message,
                );
            } else if (e.keyPattern?.username) {
                throw new DuplicateKeyError(
                    'A user with that username already exists',
                    e.keyValue || e.message,
                );
            }
        }
        throw err;
    }
};

export const deleteUser = async (username: string) => {
    return await User.findOneAndDelete({ username });
};
