import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

const COLLECTOR_SERVICE_URL = bootEnv.COLLECTOR_SERVICE_URL;

export const validateFetcherExists = async (fetcherId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${COLLECTOR_SERVICE_URL}/api/v1/fetchers/${fetcherId}`, {
            method: 'GET',
            headers: serviceHeaders,
        });
        const result = await response.json();
        if (result.success) return null;
        return result.error?.message || `fetcherId '${fetcherId}' not found in collector`;
    } catch {
        return `Could not connect to collector to validate fetcherId '${fetcherId}'`;
    }
};
