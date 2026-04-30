import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

const COMPUTER_SERVICE_URL = bootEnv.COMPUTER_SERVICE_URL;

export const validateEventExists = async (eventId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${COMPUTER_SERVICE_URL}/api/v1/events/${eventId}`, {
            method: 'GET',
            headers: serviceHeaders,
        });
        const result = await response.json();
        if (result.success) return null;
        return result.error?.message || `eventId '${eventId}' not found in computer`;
    } catch {
        return `Could not connect to computer to validate eventId '${eventId}'`;
    }
};

export const validateEventConfig = async (
    eventId: string,
    fetcherConfigs: { fetcherId: string; fetcherConfig: Record<string, unknown> }[],
    processConfig: Record<string, unknown>,
): Promise<string | null> => {
    try {
        const response = await fetch(`${COMPUTER_SERVICE_URL}/api/v1/events/${eventId}/validate`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ fetcherConfigs, processConfig }),
        });
        const result = await response.json();
        if (result.success && result.data?.valid) return null;
        return result.data?.error || `event '${eventId}' config validation failed in computer`;
    } catch {
        return `Could not connect to computer to validate event '${eventId}' config`;
    }
};

export const validateAggregator = async (
    aggregatorType: string,
    aggregatorConfig: Record<string, unknown>,
): Promise<string | null> => {
    try {
        const response = await fetch(
            `${COMPUTER_SERVICE_URL}/api/v1/aggregators/${aggregatorType}/validate`,
            {
                method: 'POST',
                headers: serviceHeaders,
                body: JSON.stringify({ aggregatorConfig }),
            },
        );
        const result = await response.json();
        if (result.success && result.data?.valid) return null;
        return result.data?.error || `aggregator '${aggregatorType}' validation failed in computer`;
    } catch {
        return `Could not connect to computer to validate aggregator '${aggregatorType}'`;
    }
};
