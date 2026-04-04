import dotenv from 'dotenv';
import path from 'path';

// Load .env file
const envPath = process.env.GOV_BOOT_ENV_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, quiet: true });

export const bootEnv = {
    // Service configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOV_LOG_LEVEL: process.env.GOV_LOG_LEVEL || 'INFO',
    GOV_SERVICE_NAME: process.env.GOV_SERVICE_NAME || 'registry',
    PORT: process.env.PORT || '5900',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify',

    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'governify_secret_key',

    // External services
    REPORTER_URL: process.env.REPORTER_URL || 'http://localhost:5901',

    // Application-specific settings
    MAX_ROLES_PER_ORGANIZATION: Number(process.env.MAX_ROLES_PER_ORGANIZATION || '100'),
    MAX_MEMBERS_PER_ORGANIZATION: Number(process.env.MAX_MEMBERS_PER_ORGANIZATION || '1000'),
};
