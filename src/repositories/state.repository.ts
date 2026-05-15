import State, { IState } from '../models/state.model.js';

export const createState = async (data: Partial<IState>) => {
    const state = new State(data);
    return await state.save();
};

export const updateStateById = async (id: string, data: Partial<IState>) => {
    return await State.findByIdAndUpdate(id, data, { new: true });
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
