import cors from 'cors';
import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import env, { corsOrigins } from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import { errorHandler, notFoundHandler } from '@/core/http/errorHandler.js';
import { createAppRouters } from '@/core/composition/createAppRouters.js';

const allowedOrigins = new Set(corsOrigins);

const READ_METHODS = new Set(['GET', 'HEAD']);

const isReadRequest = (request: Request): boolean => {
    const method = request.method === 'OPTIONS'
        ? String(request.headers['access-control-request-method'] ?? '').toUpperCase()
        : request.method;
    return READ_METHODS.has(method);
};

// Reading the registry is public and credential-free, so any origin may read it (a VOLT server
// running in a browser installs plugins from its page's origin); publishing stays limited to the
// configured origins.
const corsMiddleware = cors((request, callback) => {
    const origin = request.headers.origin;
    callback(null, {
        credentials: false,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
        origin: !origin || isReadRequest(request as Request) || allowedOrigins.has(origin)
    });
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
    // Packages and tarballs are fetched cross-origin, including by cross-origin isolated pages.
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
