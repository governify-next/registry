import { bootEnv } from '../config/bootConfig.js';
import { IWindow } from '../types/window.types.js';
import { IMetricConfig } from '../types/metric.types.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ITemporalContext } from '../types/temporal.types.js';
import { IMetric } from '../types/metric.types.js';

const COMPUTER_SERVICE_URL = bootEnv.COMPUTER_SERVICE_URL;

// Function to check health of computer service
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${COMPUTER_SERVICE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const validateEventExists = async (eventId: string): Promise<string | null> => {
    const response = await fetch(`${COMPUTER_SERVICE_URL}/api/v1/events/${eventId}`, {
        method: 'GET',
        headers: getServiceHeaders(),
    });
    const result = await response.json();

    if (response.status >= 500) {
        throw new Error(
            result.error?.message || `Computer failed to validate eventId '${eventId}'`,
        );
    }

    if (result.success) return null;

    return result.error?.message;
};

export const validateEventConfig = async (
    eventId: string,
    fetcherConfigs: { fetcherId: string; fetcherConfig: Record<string, unknown> }[],
    processConfig: Record<string, unknown>,
): Promise<string | null> => {
    const response = await fetch(`${COMPUTER_SERVICE_URL}/api/v1/events/${eventId}/validate`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({ fetcherConfigs, processConfig }),
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            result.error?.message || `Computer failed to validate event '${eventId}' config`,
        );
    }
    if (result.data?.valid) return null;

    return result.data?.error;
};

export const validateAggregator = async (
    aggregatorType: string,
    aggregatorConfig: Record<string, unknown>,
): Promise<string | null> => {
    const response = await fetch(
        `${COMPUTER_SERVICE_URL}/api/v1/aggregators/${aggregatorType}/validate`,
        {
            method: 'POST',
            headers: getServiceHeaders(),
            body: JSON.stringify({ aggregatorConfig }),
        },
    );
    const result = await response.json();
    if (!result.success) {
        throw new Error(
            result.error?.message || `Computer failed to validate aggregator '${aggregatorType}'`,
        );
    }
    if (result.data?.valid) return null;
    return result.data?.error;
};

export const computeMetric = async (
    temporalContext: ITemporalContext,
    window: IWindow,
    event: IMetricConfig['event'],
    aggregation: IMetricConfig['aggregation'],
) => {
    const response = await fetch(`${COMPUTER_SERVICE_URL}/api/v1/metric/compute`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({ temporalContext, event: { ...event, window }, aggregation }),
    });
    const result = await response.json();

    if (!result.success) {
        throw new ExternalServiceError(
            `Failed to compute metric for event '${event.eventId}' and aggregation '${aggregation.aggregatorType}'`,
            result.error,
        );
    }

    return result.data as Omit<IMetric, 'metricName' | 'errorMessage'>;
};
