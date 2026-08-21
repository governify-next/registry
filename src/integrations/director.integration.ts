import { bootEnv } from '../config/bootConfig.js';
import { ExternalServiceError } from '../utils/customErrors.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';

const DIRECTOR_SERVICE_URL = bootEnv.DIRECTOR_SERVICE_URL;

export interface IRecurringFetchTaskInputArgs {
    fetcherId: string;
    fetcherConfig: Record<string, unknown>;
    orgId: string;
    scopeId: string;
    agColId: string;
    versionNumber: number;
}

export interface IRecurringStateTaskInputArgs {
    orgName: string;
    scopeId: string;
    orgId: string;
    agColId: string;
    agreementVersion: number;
    signatureId: string;
}

export interface IDirectorTaskFilters {
    script?: string;
    inputArgs?: Record<string, unknown>;
    type?: 'IMMEDIATE' | 'PROGRAMMED' | 'RECURRING';
    enabled?: boolean;
}

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
    inputArgs: IRecurringFetchTaskInputArgs,
    enabled: boolean,
    startDate: Date,
    endDate: Date,
    anchorDate: Date,
    interval: number,
) => {
    const response = await fetch(`${DIRECTOR_SERVICE_URL}/api/v1/tasks`, {
        method: 'POST',
        headers: getServiceHeaders(),
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

export const createRecurringStateTask = async (
    inputArgs: IRecurringStateTaskInputArgs,
    enabled: boolean,
    startDate: Date,
    endDate: Date,
    anchorDate: Date,
    interval: number,
) => {
    const response = await fetch(`${DIRECTOR_SERVICE_URL}/api/v1/tasks`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({
            script: 'generateConsolidatedStates',
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
        throw new ExternalServiceError('Failed to create recurring state task', result.error);
    }

    return result.data;
};

export const getTasksByFilters = async (filters: IDirectorTaskFilters) => {
    const response = await fetch(`${DIRECTOR_SERVICE_URL}/api/v1/tasks/search`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify(filters),
    });

    const result = await response.json();

    if (!result.success) {
        throw new ExternalServiceError('Failed to get Director tasks', result.error);
    }

    return result.data;
};

export const deleteTasksByFilters = async (filters: IDirectorTaskFilters) => {
    const response = await fetch(`${DIRECTOR_SERVICE_URL}/api/v1/tasks/search/delete`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify(filters),
    });

    const result = await response.json();

    if (!result.success) {
        throw new ExternalServiceError('Failed to delete Director tasks', result.error);
    }

    return result.data;
};
