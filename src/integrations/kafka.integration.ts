import { Kafka, logLevel, type Producer } from 'kafkajs';
import { bootEnv } from '../config/bootConfig.js';
import type { IState } from '../models/state.model.js';
import { getLogger } from '../utils/logger.js';

let producer: Producer | undefined;

export const connectKafka = async () => {
    if (!bootEnv.STATE_EVENTS_PUBLISH_ENABLED) return;
    producer = new Kafka({
        clientId: 'governify-registry-state-events',
        brokers: bootEnv.KAFKA_BOOTSTRAP_SERVERS.split(',').map((broker) => broker.trim()),
        connectionTimeout: bootEnv.STATE_EVENTS_DELIVERY_TIMEOUT_MS,
        requestTimeout: bootEnv.STATE_EVENTS_DELIVERY_TIMEOUT_MS,
        logLevel: logLevel.NOTHING,
    }).producer({ idempotent: true });
    await producer.connect();
};

export const publishState = async (state: IState): Promise<void> => {
    if (!producer) return;
    try {
        await producer.send({
            topic: bootEnv.STATE_EVENTS_TOPIC,
            timeout: bootEnv.STATE_EVENTS_DELIVERY_TIMEOUT_MS,
            messages: [
                {
                    key: state._id.toString(),
                    value: JSON.stringify(state),
                },
            ],
        });
    } catch {
        getLogger().setTag('kafka').error('State publication failed or unconfirmed', {
            stateId: state._id.toString(),
        });
    }
};
