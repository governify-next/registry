import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

const SCOPE_MANAGER_SERVICE_URL = bootEnv.SCOPE_MANAGER_SERVICE_URL;

export const getElementByOrgAndNameAndElementName = async (
    orgName: string,
    elementName: string,
) => {
    const response = await fetch(
        `${SCOPE_MANAGER_SERVICE_URL}/api/v1/organizations/${orgName}/elements/${elementName}`,
        {
            method: 'GET',
            headers: serviceHeaders,
        },
    );

    const result = await response.json();

    if (result.httpStatus === 404) return null;

    if (!result.success)
        throw new Error(
            `Failed to fetch element '${elementName}' from scope-manager (status: ${response.status})`,
        );

    return result.data;
};

export const getOrganizationByName = async (orgName: string) => {
    const response = await fetch(`${SCOPE_MANAGER_SERVICE_URL}/api/v1/organizations/${orgName}`, {
        method: 'GET',
        headers: serviceHeaders,
    });

    const result = await response.json();

    if (!result.success)
        throw new Error(
            `Failed to fetch organization '${orgName}' from scope-manager (status: ${response.status})`,
        );

    return result.data;
};
