export enum TemporalMode {
    CAPTURE = 'CAPTURE',
    REPLAY = 'REPLAY',
}

export interface ITemporalContext {
    effectiveAt: Date;
    mode: TemporalMode;
}

export enum ExistingStatePolicy {
    KEEP = 'KEEP',
    REPLACE = 'REPLACE',
}
