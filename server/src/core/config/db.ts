import mongoose from 'mongoose';
import env from '@/core/config/env.js';
import logger from '@/core/config/logger.js';

export const connectDatabase = async (): Promise<typeof mongoose> => {
    mongoose.set('strictQuery', true);
    const connection = await mongoose.connect(env.MONGO_URL, {
        serverSelectionTimeoutMS: 10000
    });
    logger.info({ mongoUrl: env.MONGO_URL }, 'mongo connected');
    return connection;
};

export const disconnectDatabase = async (): Promise<void> => {
    await mongoose.disconnect();
};
