import * as agreementVersionService from './agreementVersion.service.js';
import * as agreementCollectionRepository from '../repositories/agreementCollection.repository.js';
import * as fetcherIntegration from '../integrations/fetcher.integration.js';
import * as directorIntegration from '../integrations/director.integration.js';
import * as scopeManagerIntegration from '../integrations/scope-manager.integration.js';
import { IFetcherConfig } from '../types/metric.types.js';
import { IWindow } from '../types/window.types.js';
import * as windowUtil from '../utils/window.util.js';
import { ConsolidationFetch } from '../types/fetcher.types.js';
import { fromPeriodToMilliseconds } from '../utils/window.util.js';

type IFetcherConfigWithWindow = {
    fetcherConfig: IFetcherConfig;
    window: IWindow;
};

export const fetchAuditableVersionFetchResults = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    date: Date,
    expand: boolean,
    isAsync: boolean,
) => {
    const auditableAgreementVersion = await agreementVersionService.getAuditableVersionByCollection(
        orgName,
        scopeId,
        agColName,
        true,
    );
    const signatures =
        'signatures' in auditableAgreementVersion!.contract
            ? auditableAgreementVersion!.contract.signatures
            : [];

    const fetcherConfigs = signatures.flatMap((signature) =>
        signature.guarantee.metrics.flatMap((metric) =>
            metric.metricConfig.event.fetcherConfigs.map((fetcherConfig) => ({
                fetcherConfig,
                window: signature.guarantee.window,
            })),
        ),
    );

    const fetchResults = await fetchFetchResults(date, fetcherConfigs, isAsync);

    return {
        fetchResults: expand ? fetchResults : fetchResults.map((fetchResult) => fetchResult._id),
        hasFailedFetchResults: fetchResults.some((fetchResult) => fetchResult.status === 'FAILED'),
    };
};

export const getConsolidationFetchesForAuditableVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
): Promise<ConsolidationFetch[]> => {
    const auditableAgreementVersion = await agreementVersionService.getAuditableVersionByCollection(
        orgName,
        scopeId,
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
                    addFetchDate(fetches, fetcherConfig, signature.guarantee.window, date);
                }
            }
        }
    }

    return [...fetches.values()];
};

const addFetchDate = (
    fetches: Map<string, ConsolidationFetch>,
    fetcherConfig: IFetcherConfig,
    window: IWindow,
    date: Date,
) => {
    const fetchKey = buildFetchKey(fetcherConfig, window);
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
    fetcherConfigs: IFetcherConfigWithWindow[],
    isAsync: boolean,
) => {
    const uniqueFetches = new Map<string, IFetcherConfigWithWindow>();

    for (const fetcherConfig of fetcherConfigs) {
        uniqueFetches.set(
            buildFetchKey(fetcherConfig.fetcherConfig, fetcherConfig.window),
            fetcherConfig,
        );
    }

    return await Promise.all(
        [...uniqueFetches.values()].map(({ fetcherConfig }) =>
            fetcherIntegration.generateFetchResult(
                fetcherConfig.fetcherId,
                date,
                fetcherConfig.fetcherConfig!,
                isAsync,
            ),
        ),
    );
};

const buildFetchKey = (fetcherConfig: IFetcherConfig, window: IWindow) => {
    return JSON.stringify({
        fetcherConfig,
        window,
    });
};

export const createConsolidationFetchTasksForAuditableVersion = async (
    orgName: string,
    scopeId: string,
    agColName: string,
    enabled: boolean,
) => {
    const auditableAgreementVersion = await agreementVersionService.getAuditableVersionByCollection(
        orgName,
        scopeId,
        agColName,
        true,
    );

    const signatures =
        'signatures' in auditableAgreementVersion!.contract
            ? auditableAgreementVersion!.contract.signatures
            : [];

    const fetcherConfigsWithWindow: IFetcherConfigWithWindow[] = [
        ...new Map(
            signatures
                .flatMap((signature) =>
                    signature.guarantee.metrics.flatMap((metric) =>
                        metric.metricConfig.event.fetcherConfigs.map((fetcherConfig) => ({
                            fetcherConfig,
                            window: signature.guarantee.window,
                        })),
                    ),
                )
                .map((fetcherConfigWithWindow) => [
                    buildFetchKey(
                        fetcherConfigWithWindow.fetcherConfig,
                        fetcherConfigWithWindow.window,
                    ),
                    fetcherConfigWithWindow,
                ]),
        ).values(),
    ];

    const [organization, element] = await Promise.all([
        scopeManagerIntegration.getOrganizationByName(orgName),
        scopeManagerIntegration.getScopeByOrgAndScopeId(orgName, scopeId),
    ]);
    const agreementCollection = await agreementCollectionRepository.getAgreementCollectionByScope(
        element!._id,
        agColName,
    );

    const orgId = organization!._id;
    const elementId = element!._id;
    const agColId = agreementCollection!._id;
    const versionNumber = auditableAgreementVersion!.versionNumber;

    const startDate = new Date(auditableAgreementVersion!.contract.validity.initial);
    const endDate = new Date(auditableAgreementVersion!.contract.validity.end);

    const fetchTasks = await Promise.all(
        fetcherConfigsWithWindow.map((fetcherConfigWithWindow) => {
            const { fetcherConfig, window } = fetcherConfigWithWindow;
            const inputArgs = {
                fetcherId: fetcherConfig.fetcherId,
                fetcherConfig: fetcherConfig.fetcherConfig!,
                orgId,
                elementId,
                agColId,
                versionNumber,
            };
            return directorIntegration.createRecurringFetchTask(
                inputArgs,
                enabled,
                startDate,
                endDate,
                window.anchorDate,
                fromPeriodToMilliseconds(window.period),
            );
        }),
    );

    return fetchTasks;
};
