import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import env from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import { UnauthorizedError } from '@/core/errors/AppError.js';

export interface Identity {
    accountId: string;
    username: string;
    scopes?: string[];
    scopeMask?: number;
}

declare module 'express-serve-static-core' {
    interface Request {
        identity?: Identity;
    }
}

const jwks = createRemoteJWKSet(new URL(env.CONSOLE_JWKS_URL));

interface IntrospectionResult {
    active: boolean;
    accountId?: string;
    username?: string;
    scopes?: string[];
    scopeMask?: number;
    expiresAt?: string;
}

interface CacheEntry {
    expiresAtMs: number;
    result: IntrospectionResult;
}

const PAT_CACHE_TTL_MS = 30_000;
const patCache = new Map<string, CacheEntry>();

const introspectPat = async (token: string): Promise<IntrospectionResult> => {
    const cached = patCache.get(token);
    const now = Date.now();
    if (cached && cached.expiresAtMs > now) {
        return cached.result;
    }

    const response = await fetch(`${env.CONSOLE_URL}/auth/introspect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.CONSOLE_SERVICE_TOKEN}`
        },
        body: JSON.stringify({ token })
    });

    if (!response.ok) {
        throw new UnauthorizedError('Token introspection failed');
    }

    const result = (await response.json()) as IntrospectionResult;
    patCache.set(token, { expiresAtMs: now + PAT_CACHE_TTL_MS, result });
    return result;
};

const verifyJwt = async (token: string): Promise<Identity> => {
    const { payload } = await jwtVerify(token, jwks, {
        issuer: 'https://console.voltcloud.dev',
        audience: 'registry.voltcloud.dev'
    });

    const sub = (payload as JWTPayload).sub;
    if (!sub) {
        throw new UnauthorizedError('JWT missing sub');
    }

    const { username } = payload as { username: string };

    return {
        accountId: sub,
        username
    };
};

export const requireAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const header = req.header('authorization') ?? req.header('Authorization');
        if (!header || !header.toLowerCase().startsWith('bearer ')) {
            throw new UnauthorizedError('Missing bearer token');
        }

        const token = header.slice(7).trim();
        if (!token) {
            throw new UnauthorizedError('Empty bearer token');
        }

        if (token.startsWith('vpm_pub_')) {
            const result = await introspectPat(token);
            if (!result.active || !result.accountId || !result.username) {
                throw new UnauthorizedError('Inactive token');
            }
            req.identity = {
                accountId: result.accountId,
                username: result.username,
                scopes: result.scopes,
                scopeMask: result.scopeMask
            };
            next();
            return;
        }

        const identity = await verifyJwt(token);
        req.identity = identity;
        next();
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            next(err);
            return;
        }
        logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'auth failed');
        next(new UnauthorizedError('Invalid credentials'));
    }
};

export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const header = req.header('authorization') ?? req.header('Authorization');
    if (!header) {
        next();
        return;
    }
    await requireAuth(req, res, next);
};
