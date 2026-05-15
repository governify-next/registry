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
    PORT: process.env.PORT || '5902',

    // Internal service URLs
    SCOPE_MANAGER_SERVICE_URL: process.env.SCOPE_MANAGER_SERVICE_URL || 'http://localhost:5901',
    COMPUTER_SERVICE_URL: process.env.COMPUTER_SERVICE_URL || 'http://localhost:5903',
    COLLECTOR_SERVICE_URL: process.env.COLLECTOR_SERVICE_URL || 'http://localhost:5904',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify-next',

    // JWT configuration
    SERVICE_AUTHENTICATION_ENABLED: process.env.SERVICE_AUTHENTICATION_ENABLED === 'true',
    JWT_SECRET: process.env.JWT_SECRET || 'governify_next_secret_key',
};
