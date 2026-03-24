import mongoose, { Schema, Document } from 'mongoose';

// Interfaz para TypeScript

export interface IMetric extends Document {
    title: string;
}

const metricSchema = new Schema<IMetric>({
    title: { type: String, required: true, unique: true },
});

// Esquema principal

const Metric = mongoose.model<IMetric>('Metric', metricSchema);
export default Metric;
