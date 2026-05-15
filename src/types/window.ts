export type WindowUnit =
    | 'millisecond'
    | 'milisecond'
    | 'second'
    | 'minute'
    | 'hour'
    | 'day'
    | 'week';

export interface IWindowPeriod {
    unit: WindowUnit;
    value: number;
}

export interface IWindow {
    period: IWindowPeriod[];
    anchorDate: Date;
}
