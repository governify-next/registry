import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = process.env.GOV_BOOT_ENV_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

export const bootEnv = {
    // Service configuration
    GOV_LOG_LEVEL: process.env.GOV_LOG_LEVEL || 'INFO',
    GOV_SERVICE_NAME: process.env.GOV_SERVICE_NAME || 'registry',
    PORT: process.env.PORT || '3000',
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify',

    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',

    // Application-specific settings
    MAX_ROLES_PER_ORGANIZATION: parseInt(process.env.MAX_ROLES_PER_ORGANIZATION || '100', 10),
    MAX_MEMBERS_PER_ORGANIZATION: parseInt(process.env.MAX_MEMBERS_PER_ORGANIZATION || '1000', 10),
};
