import mongoose from 'mongoose';
import { bootEnv } from '../config/bootConfig.js';

const MONGO_URI = bootEnv.MONGO_URI;

export const connectMongo = async () => {
    await mongoose.connect(MONGO_URI);
};

export const disconnectMongo = async () => {
    await mongoose.disconnect();
};
