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
    AUTHENTICATOR_SERVICE_URL: process.env.AUTHENTICATOR_SERVICE_URL || 'http://localhost:5900',
    SCOPE_MANAGER_SERVICE_URL: process.env.SCOPE_MANAGER_SERVICE_URL || 'http://localhost:5901',
    COMPUTER_SERVICE_URL: process.env.COMPUTER_SERVICE_URL || 'http://localhost:5903',
    FETCHER_SERVICE_URL: process.env.FETCHER_SERVICE_URL || 'http://localhost:5904',
    DIRECTOR_SERVICE_URL: process.env.DIRECTOR_SERVICE_URL || 'http://localhost:5906',

    // Database URIs
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/governify-next',

    // JWT configuration
    CLIENT_ID: process.env.CLIENT_ID || 'registry',
    CLIENT_SECRET: process.env.CLIENT_SECRET || 'registry_client_secret',
    JWT_SECRET: process.env.JWT_SECRET || 'governify_next_secret_key',
    JWT_ISSUER: process.env.JWT_ISSUER || 'authenticator',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'governify-next',
};
