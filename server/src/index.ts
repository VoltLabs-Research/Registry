import env from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import { connectDatabase, disconnectDatabase } from '@/core/config/db.js';
import { createApp } from '@/core/config/express.js';

const bootstrap = async (): Promise<void> => {
    await connectDatabase();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
        logger.info({ port: env.PORT }, 'registry listening');
    });

    const shutdown = async (signal: string): Promise<void> => {
        logger.info({ signal }, 'shutting down');
        server.close(() => {
            void disconnectDatabase().finally(() => process.exit(0));
        });
        setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

bootstrap().catch((err) => {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, 'bootstrap failed');
    process.exit(1);
});
