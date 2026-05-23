export interface ConsolidationFetch {
    fetcherId: string;
    fetcherConfig: Record<string, unknown>;
    consolidationDates: Date[];
}
