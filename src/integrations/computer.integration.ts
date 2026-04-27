import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

export const validateEventExists = async (eventId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${bootEnv.COMPUTER_URL}/api/v1/events/${eventId}`, {
            method: 'GET',
            headers: serviceHeaders,
        });
        if (response.ok) return null;
        const data = await response.json();
        return data.error || `eventId '${eventId}' not found in computer`;
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
        const response = await fetch(`${bootEnv.COMPUTER_URL}/api/v1/events/${eventId}/validate`, {
            method: 'POST',
            headers: serviceHeaders,
            body: JSON.stringify({ fetcherConfigs, processConfig }),
        });
        const data = await response.json();
        if (response.ok && data.data?.valid) return null;
        return data.data?.error || `event '${eventId}' config validation failed in computer`;
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
            `${bootEnv.COMPUTER_URL}/api/v1/aggregators/${aggregatorType}/validate`,
            {
                method: 'POST',
                headers: serviceHeaders,
                body: JSON.stringify({ aggregatorConfig }),
            },
        );
        const data = await response.json();
        if (response.ok && data.data?.valid) return null;
        return data.data?.error || `aggregator '${aggregatorType}' validation failed in computer`;
    } catch {
        return `Could not connect to computer to validate aggregator '${aggregatorType}'`;
    }
};
