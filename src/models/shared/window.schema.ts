import { Schema } from 'mongoose';
import { windowUnits } from '../../types/window.types.js';

export const windowSchema = new Schema(
    {
        period: {
            type: [
                {
                    unit: {
                        type: String,
                        required: true,
                        enum: windowUnits,
                    },
                    value: {
                        type: Number,
                        required: true,
                    },
                    _id: false,
                },
            ],
            required: true,
        },
        anchorDate: { type: Date, required: true },
    },
    { _id: false },
);
