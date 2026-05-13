import { bootEnv } from '../config/bootConfig.js';
import { ExternalServiceError } from '../utils/customErrors.js';
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

// TODO: A futuro para el cálculo directo de fetchs
export const generateFetchResult = async (
    fetcherId: string,
    date: Date,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(
        `${COLLECTOR_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/generate`,
        {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({
                date,
                fetcherConfig: fetcherConfig,
            }),
        },
    );
    const result = await response.json();

    if (!result.success)
        throw new ExternalServiceError(
            `Failed to initiate fetch result generation for fetcher ${fetcherId}`,
        );

    return result.data;
};
