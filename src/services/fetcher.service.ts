import * as agreementVersionService from './agreementVersion.service.js';
import * as collectorIntegration from '../integrations/collector.integration.js';
import { IFetcherConfig } from '../types/metric.js';

export const fetchAuditableVersionFetchResults = async (
    orgName: string,
    elementName: string,
    agColName: string,
    date: Date,
    expand: boolean,
) => {
    const auditableAgreementVersion = await agreementVersionService.getAuditableVersionByCollection(
        orgName,
        elementName,
        agColName,
        true,
    );
    const signatures =
        'signatures' in auditableAgreementVersion!.contract
            ? auditableAgreementVersion!.contract.signatures
            : [];

    const fetcherConfigs = signatures.flatMap((signature) =>
        signature.guarantee.metrics.flatMap((metric) => metric.metricConfig.event.fetcherConfigs),
    );

    const fetchResults = await fetchFetchResults(date, fetcherConfigs);

    return {
        fetchResults: expand ? fetchResults : fetchResults.map((fetchResult) => fetchResult._id),
        hasFailedFetchResults: fetchResults.some(
            (fetchResult) => fetchResult.status !== 'COMPLETED',
        ),
    };
};

const fetchFetchResults = async (date: Date, fetcherConfigs: IFetcherConfig[]) => {
    const uniqueFetches = new Map<string, IFetcherConfig>();

    for (const fetcherConfig of fetcherConfigs) {
        uniqueFetches.set(buildFetchResultKey(fetcherConfig), fetcherConfig);
    }

    return await Promise.all(
        [...uniqueFetches.values()].map((fetcherConfig) =>
            collectorIntegration.generateFetchResult(
                fetcherConfig.fetcherId,
                date,
                fetcherConfig.fetcherConfig!,
            ),
        ),
    );
};

const buildFetchResultKey = (fetcherConfig: IFetcherConfig) => {
    return JSON.stringify({
        fetcherId: fetcherConfig.fetcherId,
        fetcherConfig: fetcherConfig.fetcherConfig,
    });
};
