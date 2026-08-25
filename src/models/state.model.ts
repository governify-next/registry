import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWindow } from '../types/window.types.js';
import { IMetric } from '../types/metric.types.js';
import { windowSchema } from './shared/window.schema.js';
import { metricSchema } from './shared/metric.schema.js';
import { Comparator, comparators } from '../types/comparator.types.js';

export enum StateStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum ComplianceStatus {
    COMPLIANT = 'COMPLIANT',
    NON_COMPLIANT = 'NON_COMPLIANT',
    INDETERMINATE = 'INDETERMINATE',
}

export interface IState extends Document {
    signatureId: Types.ObjectId;
    generationId: string;
    attempt: number;
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
    complianceStatus: ComplianceStatus | null;
    window: IWindow;
    metrics: IMetric[];
}

const validateComplianceStatus = (
    status: StateStatus,
    complianceStatus: ComplianceStatus | null,
) => {
    if (status === StateStatus.IN_PROGRESS && complianceStatus !== null) {
        throw new Error('An IN_PROGRESS state cannot have a compliance result');
    }
    if (status === StateStatus.COMPLETED && complianceStatus === null) {
        throw new Error('A COMPLETED state must have a compliance result');
    }
    if (status === StateStatus.FAILED && complianceStatus !== ComplianceStatus.INDETERMINATE) {
        throw new Error('A FAILED state must have an INDETERMINATE compliance result');
    }
};

const stateSchema = new Schema<IState>(
    {
        signatureId: { type: Types.ObjectId, required: true },
        generationId: { type: String, required: true },
        attempt: { type: Number, required: true, default: 1 },
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
        complianceStatus: {
            type: String,
            enum: Object.values(ComplianceStatus),
            default: null,
        },
        window: { type: windowSchema, required: true },
        metrics: { type: [metricSchema], required: true },
    },
    { timestamps: true, minimize: false },
);

stateSchema.pre('validate', function () {
    validateComplianceStatus(this.status, this.complianceStatus);
});

stateSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate();
    if (!update || Array.isArray(update)) {
        return;
    }

    const stateUpdate = update as {
        status?: StateStatus;
        complianceStatus?: ComplianceStatus | null;
        $set?: {
            status?: StateStatus;
            complianceStatus?: ComplianceStatus | null;
        };
        $setOnInsert?: {
            status?: StateStatus;
            complianceStatus?: ComplianceStatus | null;
        };
    };
    const updateSources = [stateUpdate, stateUpdate.$set, stateUpdate.$setOnInsert];
    const statusSource = updateSources.find((source) => source && Object.hasOwn(source, 'status'));
    const complianceStatusSource = updateSources.find(
        (source) => source && Object.hasOwn(source, 'complianceStatus'),
    );

    if (Boolean(statusSource) !== Boolean(complianceStatusSource)) {
        throw new Error('status and complianceStatus must be updated together');
    }
    if (statusSource && complianceStatusSource) {
        validateComplianceStatus(statusSource.status!, complianceStatusSource.complianceStatus!);
    }
});

stateSchema.index({ signatureId: 1, date: 1 }, { unique: true });

const State = mongoose.model<IState>('State', stateSchema);

export default State;
