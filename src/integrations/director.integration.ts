import { bootEnv } from '../config/bootConfig.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

const DIRECTOR_SERVICE_URL = bootEnv.DIRECTOR_SERVICE_URL;

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${DIRECTOR_SERVICE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const createRecurringFetchTask = async (
    inputArgs: Record<string, unknown>,
    enabled: boolean,
    startDate: Date,
    endDate: Date,
    anchorDate: Date,
    interval: number,
) => {
    const response = await fetch(`${DIRECTOR_SERVICE_URL}/api/v1/tasks`, {
        method: 'POST',
        headers: serviceHeaders,
        body: JSON.stringify({
            script: 'fetchFetcher',
            inputArgs,
            type: 'RECURRING',
            enabled,
            startDate,
            endDate,
            anchorDate,
            interval,
        }),
    });

    const result = await response.json();

    if (!result.success) {
        throw new ExternalServiceError('Failed to create recurring fetch task', result.error);
    }

    return result.data;
};
