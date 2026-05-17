import { bootEnv } from '../config/bootConfig.js';
import { IWindow } from '../types/window.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

const COMPUTER_SERVICE_URL = bootEnv.COMPUTER_SERVICE_URL;

// Function to check health of computer service
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${COMPUTER_SERVICE_URL}/health`, {
            method: 'GET',
        });
        const result = await response.json();
        return result;
    } catch {
        return false;
    }
};

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

export const computeMetric = async (
    date: Date,
    window: IWindow,
    event: Record<string, unknown>,
    aggregation: Record<string, unknown>,
) => {
    const response = await fetch(`${COMPUTER_SERVICE_URL}/api/v1/metric/compute`, {
        method: 'POST',
        headers: serviceHeaders,
        body: JSON.stringify({ event: { ...event, date, window }, aggregation }),
    });
    const result = await response.json();

    if (!result.success) {
        throw new ExternalServiceError(
            `Failed to compute metric for event '${event.eventId}' and aggregation '${aggregation.aggregatorType}'`,
            result.error,
        );
    }

    return result.data;
};
