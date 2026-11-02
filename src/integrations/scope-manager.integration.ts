import { bootEnv } from '../config/bootConfig.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';

const SCOPE_MANAGER_SERVICE_URL = bootEnv.SCOPE_MANAGER_SERVICE_URL;

export const getScopeByOrgAndScopeId = async (orgName: string, scopeId: string) => {
    const response = await fetch(
        `${SCOPE_MANAGER_SERVICE_URL}/api/v1/organizations/${orgName}/scopes/${scopeId}`,
        {
            method: 'GET',
            headers: getServiceHeaders(),
        },
    );

    const result = await response.json();

    if (result.httpStatus === 404) return null;

    if (!result.success)
        throw new Error(
            `Failed to fetch scope '${scopeId}' from scope-manager (status: ${response.status})`,
        );

    return result.data;
};

export const getOrganizationByName = async (orgName: string) => {
    const response = await fetch(`${SCOPE_MANAGER_SERVICE_URL}/api/v1/organizations/${orgName}`, {
        method: 'GET',
        headers: getServiceHeaders(),
    });

    const result = await response.json();

    if (!result.success)
        throw new Error(
            `Failed to fetch organization '${orgName}' from scope-manager (status: ${response.status})`,
        );

    return result.data;
};

export const getScopeIdsByOrganization = async (orgName: string) => {
    const response = await fetch(
        `${SCOPE_MANAGER_SERVICE_URL}/api/v1/organizations/${orgName}/scopes?flat=true`,
        {
            method: 'GET',
            headers: getServiceHeaders(),
        },
    );

    const result = await response.json();

    if (!result.success)
        throw new Error(
            `Failed to fetch scopes of organization '${orgName}' from scope-manager (status: ${response.status})`,
        );

    return result.data.map((scope: { _id: string }) => scope._id);
};

export const isUserOrganizationAdmin = async (orgName: string, authorization: string) => {
    const response = await fetch(
        `${SCOPE_MANAGER_SERVICE_URL}/api/v1/organizations/${orgName}/members/me/admin`,
        {
            method: 'GET',
            headers: { Authorization: authorization },
        },
    );

    const result = await response.json();

    if (result.httpStatus === 403) return false;

    if (!result.success)
        throw new Error(
            `Failed to check admin membership in organization '${orgName}' from scope-manager (status: ${response.status})`,
        );

    return result.data.isAdmin as boolean;
};
