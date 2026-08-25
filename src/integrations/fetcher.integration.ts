import { bootEnv } from '../config/bootConfig.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ITemporalContext } from '../types/temporal.types.js';

const FETCHER_SERVICE_URL = bootEnv.FETCHER_SERVICE_URL;

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${FETCHER_SERVICE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const validateFetcherExists = async (fetcherId: string): Promise<string | null> => {
    const response = await fetch(`${FETCHER_SERVICE_URL}/api/v1/fetchers/${fetcherId}`, {
        method: 'GET',
        headers: getServiceHeaders(),
    });
    const result = await response.json();
    if (response.status >= 500) {
        throw new Error(
            result.error?.message || `Fetcher failed to validate fetcherId '${fetcherId}'`,
        );
    }
    if (result.success) return null;
    return result.error?.message;
};

export const generateFetchResult = async (
    fetcherId: string,
    temporalContext: ITemporalContext,
    fetcherConfig: Record<string, unknown>,
    isAsync: boolean,
) => {
    const response = await fetch(
        `${FETCHER_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/generate?isAsync=${isAsync}`,
        {
            method: 'POST',
            headers: getServiceHeaders(),
            body: JSON.stringify({ temporalContext, fetcherConfig }),
        },
    );

    const result = await response.json();

    if (!result.success) {
        throw new ExternalServiceError(
            `Failed to generate fetch result for fetcher ${fetcherId}`,
            result.error,
        );
    }

    return result.data;
};
