import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/core/errors/AppError.js';
import logger from '@/core/config/logger.js';

export const notFoundHandler = (_req: Request, res: Response): void => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
};

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof ZodError) {
        res.status(422).json({
            error: 'VALIDATION_FAILED',
            message: 'Invalid input',
            details: err.flatten()
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.status).json({
            error: err.code,
            message: err.message,
            details: err.details
        });
        return;
    }

    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message }, 'unhandled error');
    res.status(500).json({ error: 'INTERNAL', message: 'Internal server error' });
};
