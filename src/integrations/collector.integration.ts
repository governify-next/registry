import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

export const validateFetcherExists = async (fetcherId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${bootEnv.COLLECTOR_URL}/api/v1/fetchers/${fetcherId}`, {
            method: 'GET',
            headers: serviceHeaders,
        });
        if (response.ok) return null;
        const data = await response.json();
        return data.error?.message || `fetcherId '${fetcherId}' not found in collector`;
    } catch {
        return `Could not connect to collector to validate fetcherId '${fetcherId}'`;
    }
};
