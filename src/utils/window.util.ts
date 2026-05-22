import { IWindowPeriod, WindowUnit } from '../types/window.types.js';

export const getPeriodStartDateFromAnchorDateAndPeriod = (
    date: Date,
    anchorDate: Date,
    period: IWindowPeriod[],
): Date => {
    const periodInMilliseconds = fromPeriodToMilliseconds(period);
    const timeDifference = new Date(date).getTime() - new Date(anchorDate).getTime();
    const currentPeriodIndex = Math.floor((timeDifference - 1) / periodInMilliseconds);
    return new Date(new Date(anchorDate).getTime() + periodInMilliseconds * currentPeriodIndex);
};

const fromPeriodToMilliseconds = (period: IWindowPeriod[]): number => {
    const unitToMilliseconds: Record<WindowUnit, number> = {
        millisecond: 1,
        milisecond: 1,
        second: 1000,
        minute: 1000 * 60,
        hour: 1000 * 60 * 60,
        day: 1000 * 60 * 60 * 24,
        week: 1000 * 60 * 60 * 24 * 7,
    };

    return period.reduce((totalMilliseconds, { unit, value }) => {
        const milliseconds = unitToMilliseconds[unit] ?? 0;
        return totalMilliseconds + milliseconds * value;
    }, 0);
};

export const getConsolidationDatesInRange = (
    startDate: Date,
    endDate: Date,
    anchorDate: Date,
    period: IWindowPeriod[],
): Date[] => {
    const periodMilliseconds = fromPeriodToMilliseconds(period);
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    const anchorTime = new Date(anchorDate).getTime();

    const firstConsolidationIndex = Math.max(
        1,
        Math.ceil((startTime - anchorTime) / periodMilliseconds),
    );
    const firstConsolidationTime = anchorTime + periodMilliseconds * firstConsolidationIndex;

    const dates: Date[] = [];

    for (
        let consolidationTime = firstConsolidationTime;
        consolidationTime <= endTime;
        consolidationTime += periodMilliseconds
    ) {
        dates.push(new Date(consolidationTime));
    }

    return dates;
};

export const isConsolidated = (date: Date, anchorDate: Date, period: IWindowPeriod[]): boolean => {
    const parsedDate = new Date(date);
    const periodMilliseconds = fromPeriodToMilliseconds(period);
    const periodStartDate = getPeriodStartDateFromAnchorDateAndPeriod(date, anchorDate, period);
    return parsedDate.getTime() - periodStartDate.getTime() - periodMilliseconds === 0;
};
