import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';

export const getElementByName = async (orgName: string, elementName: string) => {
    const response = await fetch(
        `${bootEnv.SCOPE_MANAGER_URL}/api/v1/organizations/${orgName}/elements/${elementName}`,
        {
            method: 'GET',
            headers: serviceHeaders,
        },
    );

    if (response.status === 404) return null;

    if (!response.ok)
        throw new Error(
            `Failed to fetch element '${elementName}' from scope-manager (status: ${response.status})`,
        );

    const result = await response.json();
    return result.data;
};
