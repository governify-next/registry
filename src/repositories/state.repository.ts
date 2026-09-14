import State, { IState } from '../models/state.model.js';

export const createState = async (data: Partial<IState>) => {
    const state = new State(data);
    return await state.save();
};

export const claimState = async (data: Partial<IState>) => {
    const key = { signatureId: data.signatureId, date: data.date };
    try {
        return await State.findOneAndUpdate(
            key,
            { $setOnInsert: data },
            {
                new: true,
                upsert: true,
                runValidators: true,
            },
        );
    } catch (error) {
        if ((error as { code?: number }).code !== 11000) {
            throw error;
        }
        return await State.findOne(key);
    }
};

export const replaceState = async (data: Partial<IState>) => {
    const replacementData = { ...data };
    delete replacementData.attempt;
    const key = { signatureId: data.signatureId, date: data.date };
    const update = {
        $set: replacementData,
        $inc: { attempt: 1 },
    };
    try {
        return await State.findOneAndUpdate(key, update, {
            new: true,
            upsert: true,
            runValidators: true,
        });
    } catch (error) {
        if ((error as { code?: number }).code !== 11000) {
            throw error;
        }
        return await State.findOneAndUpdate(key, update, {
            new: true,
            runValidators: true,
        });
    }
};

export const updateStateById = async (id: string, data: Partial<IState>) => {
    return await State.findByIdAndUpdate(id, data, { new: true });
};

export const updateStateByIdAndGenerationId = async (
    id: string,
    generationId: string,
    data: Partial<IState>,
) => {
    return await State.findOneAndUpdate({ _id: id, generationId }, data, { new: true });
};

export const getStateById = async (id: string) => {
    return await State.findById(id);
};

export const getStatesBySignatureId = async (id: string) => {
    return await State.find({ signatureId: id });
};

export const getStatesBySignatureIds = async (signatureIds: string[]) => {
    return await State.find({ signatureId: { $in: signatureIds } });
};

export const getStateBySignatureIdAndDate = async (signatureId: string, date: Date) => {
    return await State.findOne({ signatureId, date });
};
