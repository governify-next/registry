import { bootEnv } from '../config/bootConfig.js';

export const getOrganizationByName = async (orgName: string) => {
    const response = await fetch(`${bootEnv.SCOPE_MANAGER_URL}/api/v1/organizations/${orgName}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!result.success)
        throw new Error(
            `Failed to fetch organization '${orgName}' from scope-manager (status: ${response.status})`,
        );

    return result.data;
};
