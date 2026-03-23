import { SystemRole } from './systemRole.js';

export type User = {
    username: string;
    email: string;
    password: string;
    name: string;
    surname: string;
    systemRole: SystemRole;
};
