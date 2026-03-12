export type User = {
    username: string;
    email: string;
    password: string;
    name: string;
    surname: string;
    systemRole: 'ADMIN' | 'USER';
};
