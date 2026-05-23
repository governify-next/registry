import * as agreementVersionService from './agreementVersion.service.js';
import * as collectorIntegration from '../integrations/collector.integration.js';
import { IFetcherConfig } from '../types/metric.types.js';
import * as windowUtil from '../utils/window.util.js';
import { ConsolidationFetch } from '../types/fetcher.types.js';

export const fetchAuditableVersionFetchResults = async (
    orgName: string,
    elementName: string,
    agColName: string,
    date: Date,
    expand: boolean,
    isAsync: boolean,
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

    const fetchResults = await fetchFetchResults(date, fetcherConfigs, isAsync);

    return {
        fetchResults: expand ? fetchResults : fetchResults.map((fetchResult) => fetchResult._id),
        hasFailedFetchResults: fetchResults.some((fetchResult) => fetchResult.status === 'FAILED'),
    };
};

export const getConsolidationFetchesForAuditableVersion = async (
    orgName: string,
    elementName: string,
    agColName: string,
): Promise<ConsolidationFetch[]> => {
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

    const startDate = new Date(auditableAgreementVersion!.contract.validity.initial);
    const endDate = new Date(auditableAgreementVersion!.contract.validity.end);
    const fetches = new Map<string, ConsolidationFetch>();

    for (const signature of signatures) {
        const consolidationDates = windowUtil.getConsolidationDatesInRange(
            startDate,
            endDate,
            signature.guarantee.window.anchorDate,
            signature.guarantee.window.period,
        );

        for (const date of consolidationDates) {
            for (const metric of signature.guarantee.metrics) {
                for (const fetcherConfig of metric.metricConfig.event.fetcherConfigs) {
                    addFetchDate(fetches, fetcherConfig, date);
                }
            }
        }
    }

    return [...fetches.values()];
};

const addFetchDate = (
    fetches: Map<string, ConsolidationFetch>,
    fetcherConfig: IFetcherConfig,
    date: Date,
) => {
    const fetchKey = buildFetchKey(fetcherConfig);
    const dateTime = date.getTime();

    let fetch = fetches.get(fetchKey);
    if (!fetch) {
        fetch = {
            fetcherId: fetcherConfig.fetcherId,
            fetcherConfig: fetcherConfig.fetcherConfig!,
            consolidationDates: [],
        };
        fetches.set(fetchKey, fetch);
    }

    const alreadyPlanned = fetch.consolidationDates.some(
        (consolidationDate) => consolidationDate.getTime() === dateTime,
    );
    if (!alreadyPlanned) {
        fetch.consolidationDates.push(date);
    }
};

const fetchFetchResults = async (
    date: Date,
    fetcherConfigs: IFetcherConfig[],
    isAsync: boolean,
) => {
    const uniqueFetches = new Map<string, IFetcherConfig>();

    for (const fetcherConfig of fetcherConfigs) {
        uniqueFetches.set(buildFetchKey(fetcherConfig), fetcherConfig);
    }

    return await Promise.all(
        [...uniqueFetches.values()].map((fetcherConfig) =>
            collectorIntegration.generateFetchResult(
                fetcherConfig.fetcherId,
                date,
                fetcherConfig.fetcherConfig!,
                isAsync,
            ),
        ),
    );
};

const buildFetchKey = (fetcherConfig: IFetcherConfig) => {
    return JSON.stringify({
        fetcherId: fetcherConfig.fetcherId,
        fetcherConfig: fetcherConfig.fetcherConfig,
    });
};
