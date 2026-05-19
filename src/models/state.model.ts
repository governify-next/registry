import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWindow } from '../types/window.js';
import { IMetric } from '../types/metric.js';
import { windowSchema } from './shared/window.schema.js';
import { metricSchema } from './shared/metric.schema.js';
import { Comparator, comparators } from '../types/comparator.js';

export enum StateStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface IState extends Document {
    signatureId: Types.ObjectId;
    startDate: Date;
    endDate: Date | null;
    date: Date;
    consolidated: boolean;
    status: StateStatus;
    numericExpression: string;
    comparator: Comparator;
    threshold: number;
    replacedNumericExpression: string | null;
    numericExpressionValue: number | null;
    compliant: boolean | null;
    indeterminate: boolean | null;
    window: IWindow;
    metrics: IMetric[];
}

const stateSchema = new Schema<IState>(
    {
        signatureId: { type: Types.ObjectId, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, default: null },
        date: { type: Date, required: true },
        consolidated: { type: Boolean, required: true },
        status: { type: String, enum: Object.values(StateStatus), required: true },
        numericExpression: { type: String, required: true },
        comparator: { type: String, required: true, enum: comparators },
        threshold: { type: Number, required: true },
        replacedNumericExpression: { type: String, default: null },
        numericExpressionValue: { type: Number, default: null },
        compliant: { type: Boolean, default: null },
        indeterminate: { type: Boolean, default: null },
        window: { type: windowSchema, required: true },
        metrics: { type: [metricSchema], required: true },
    },
    { timestamps: true, minimize: false },
);

const State = mongoose.model<IState>('State', stateSchema);

export default State;
