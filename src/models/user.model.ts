import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    name: string;
    surname: string;
    systemRole: 'ADMIN' | 'USER';
    validatePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        surname: { type: String, required: true },
        systemRole: { type: String, required: true, enum: ['ADMIN', 'USER'] },
    },
    { timestamps: true },
);

userSchema.methods.validatePassword = async function (this: IUser, password: string) {
    return this.password === password; // TODO: hashing implementation
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
