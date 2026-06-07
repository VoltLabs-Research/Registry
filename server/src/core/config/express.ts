import cors from 'cors';
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import env, { corsOrigins } from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import { errorHandler, notFoundHandler } from '@/core/http/errorHandler.js';
import { createAppRouters } from '@/core/composition/createAppRouters.js';

const allowedOrigins = new Set(corsOrigins);

const corsMiddleware = cors({
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    }
});

const skipJsonForMultipart = (
    middleware: express.RequestHandler
): express.RequestHandler => {
    return (request: Request, response: Response, next: NextFunction) => {
        const contentType = (request.headers['content-type'] || '').toString();
        if (contentType.startsWith('multipart/form-data')) {
            next();
            return;
        }
        middleware(request, response, next);
    };
};

export const createApp = (): Application => {
    const app = express();
    const routers = createAppRouters();

    app.set('trust proxy', 1);
    app.use(helmet());
    app.use(corsMiddleware);
    app.use(pinoHttp({ logger }));
    app.use(skipJsonForMultipart(express.json({ limit: '10mb' })));
    app.use(skipJsonForMultipart(express.urlencoded({ extended: true, limit: '10mb' })));

    app.get('/healthz', (_request: Request, response: Response) => {
        response.status(200).json({ status: 'ok', service: 'registry' });
    });

    app.head('/healthz', (_request: Request, response: Response) => {
        response.status(204).end();
    });

    app.use('/', routers.identity);
    app.use('/', routers.search);
    app.use('/', routers.download);
    app.use('/', routers.package);

    app.use(notFoundHandler);
    app.use(errorHandler);

    if (env.NODE_ENV !== 'production') {
        logger.debug({ corsOrigins: Array.from(allowedOrigins) }, 'express ready');
    }

    return app;
};
