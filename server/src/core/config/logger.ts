import { pino, stdTimeFunctions } from 'pino';
import env from '@/core/config/env.js';

const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: { service: 'registry' },
    timestamp: stdTimeFunctions.isoTime
});

export default logger;
