export const windowUnits = [
    'millisecond',
    'milisecond',
    'second',
    'minute',
    'hour',
    'day',
    'week',
] as const;

export type WindowUnit = (typeof windowUnits)[number];

export interface IWindowPeriod {
    unit: WindowUnit;
    value: number;
}

export interface IWindow {
    period: IWindowPeriod[];
    anchorDate: Date;
}
