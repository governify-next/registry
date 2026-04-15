import * as userRepository from '../repositories/user.repository.js';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model.js';
import * as oidc from 'openid-client';
import { UnauthorizedError } from '../utils/customErrors.js';
import { bootEnv } from '../config/bootConfig.js';

const oidcConfig = await oidc.discovery(
    bootEnv.OIDC_ISSUER_URL,
    bootEnv.OIDC_CLIENT_ID,
    bootEnv.OIDC_CLIENT_SECRET,
);

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

    return jwt.sign({ userId, username, systemRole }, bootEnv.JWT_SECRET, { expiresIn: '1d' });
};

export const oidcLogin = async () => {
    const loginUrl = oidc.buildAuthorizationUrl(oidcConfig, {
        redirect_uri: bootEnv.OIDC_REDIRECT_URI,
        scope: bootEnv.OIDC_SCOPE,
    });

    return { loginUrl };
};

export const oidcCallback = async (req: Request) => {
    const tokens = await oidc.authorizationCodeGrant(oidcConfig, req);

    const { sub } = tokens.claims()!;

    const user = await userRepository.getUserByEmail(sub);

    if (!user) {
        throw new UnauthorizedError('No local user is associated with that email address');
    }

    const { username, systemRole } = user;
    const userId = user._id;

    return jwt.sign({ userId, username, systemRole }, bootEnv.JWT_SECRET, { expiresIn: '1d' });
};
