import { registryClient, getClient as resolveClient } from '@/app/core/http/utilities/create-client';
import type { HttpClient } from '@/app/core/http/utilities/create-client';
import type { PaginatedResponse } from '@/shared/domain/pagination/PaginationResponse';

export interface ServiceConfig {
    client?: HttpClient | string;
    basePath?: string;
}

interface EndpointOptions<TIn, TOut = unknown> {
    body?: (input: TIn) => unknown;
    query?: (input: TIn) => Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string> | ((input: TIn) => Record<string, string>);
    client?: string;
    unwrap?: { field: string };
    map?: (payload: unknown) => TOut;
}

export type EndpointFn<TIn, TOut> = (input: TIn) => Promise<TOut>;

interface EndpointDescriptor<TIn, TOut> {
    __endpoint: true;
    build: (ctx: ServiceContext) => EndpointFn<TIn, TOut>;
}

interface ServiceContext {
    client: HttpClient;
    basePath: string;
}

const isEndpointDescriptor = (value: unknown): boolean => {
    return Boolean(value) && typeof value === 'object' && (value as { __endpoint?: boolean }).__endpoint === true;
};

const substitutePath = (path: string, input: unknown): { path: string; rest: Record<string, unknown> } => {
    if (!input || typeof input !== 'object') {
        return { path, rest: {} };
    }
    const record = { ...(input as Record<string, unknown>) };
    const finalPath = path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_, key: string) => {
        if (key in record) {
            const value = record[key];
            delete record[key];
            return encodeURIComponent(String(value));
        }
        return `:${key}`;
    });
    return { path: finalPath, rest: record };
};

const resolveHeaders = <TIn, TOut>(opts: EndpointOptions<TIn, TOut> | undefined, input: TIn): Record<string, string> | undefined => {
    if (!opts?.headers) return undefined;
    return typeof opts.headers === 'function' ? opts.headers(input) : opts.headers;
};

const unwrapResponse = <T,>(payload: unknown, unwrap?: { field: string }): T => {
    if (!unwrap) return payload as T;
    if (payload && typeof payload === 'object' && unwrap.field in payload) {
        return (payload as Record<string, unknown>)[unwrap.field] as T;
    }
    return payload as T;
};

const buildClient = (ctx: ServiceContext, endpointClient?: string): HttpClient => {
    if (!endpointClient) return ctx.client;
    return resolveClient(endpointClient);
};

const buildPath = (ctx: ServiceContext, path: string): string => {
    if (!ctx.basePath) return path;
    const left = ctx.basePath.endsWith('/') ? ctx.basePath.slice(0, -1) : ctx.basePath;
    const right = path.startsWith('/') ? path : `/${path}`;
    return `${left}${right}`;
};

const makeJsonRequest = async <TIn, TOut>(
    method: string,
    ctx: ServiceContext,
    path: string,
    opts: EndpointOptions<TIn, TOut> | undefined,
    input: TIn
): Promise<TOut> => {
    const { path: filledPath, rest } = substitutePath(buildPath(ctx, path), input);
    const client = buildClient(ctx, opts?.client);
    const bodyData = opts?.body ? opts.body(input) : rest;
    const isMethodWithBody = method !== 'GET' && method !== 'DELETE';
    const headers = resolveHeaders(opts, input);
    const query = opts?.query ? opts.query(input) : undefined;

    const result = await client.request<unknown>(method, filledPath, {
        headers,
        query: isMethodWithBody ? undefined : (query ?? (rest && Object.keys(rest).length > 0 ? rest as Record<string, string | number | boolean | undefined | null> : undefined)),
        body: isMethodWithBody && bodyData !== undefined ? JSON.stringify(bodyData) : null,
        isJsonBody: isMethodWithBody && bodyData !== undefined
    });

    const unwrapped = unwrapResponse<TOut>(result, opts?.unwrap);
    return opts?.map ? opts.map(result) : unwrapped;
};

export const get = <TIn = void, TOut = unknown>(
    path: string,
    opts?: EndpointOptions<TIn, TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: (ctx) => (input: TIn) => makeJsonRequest<TIn, TOut>('GET', ctx, path, opts, input)
});

export const post = <TIn = void, TOut = unknown>(
    path: string,
    opts?: EndpointOptions<TIn, TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: (ctx) => (input: TIn) => makeJsonRequest<TIn, TOut>('POST', ctx, path, opts, input)
});

export const patch = <TIn = void, TOut = unknown>(
    path: string,
    opts?: EndpointOptions<TIn, TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: (ctx) => (input: TIn) => makeJsonRequest<TIn, TOut>('PATCH', ctx, path, opts, input)
});

export const del = <TIn = void, TOut = unknown>(
    path: string,
    opts?: EndpointOptions<TIn, TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: (ctx) => (input: TIn) => makeJsonRequest<TIn, TOut>('DELETE', ctx, path, opts, input)
});

export const request = <TIn = void, TOut = unknown>(
    method: string,
    path: string,
    opts?: EndpointOptions<TIn, TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: (ctx) => (input: TIn) => makeJsonRequest<TIn, TOut>(method.toUpperCase(), ctx, path, opts, input)
});

export const paginated = <TIn = void, TOut = unknown>(
    path: string,
    opts?: EndpointOptions<TIn, PaginatedResponse<TOut>>
): EndpointDescriptor<TIn, PaginatedResponse<TOut>> => ({
    __endpoint: true,
    build: (ctx) => (input: TIn) => makeJsonRequest<TIn, PaginatedResponse<TOut>>('GET', ctx, path, opts, input)
});

export interface CustomHandlerContext {
    getClient: (name?: string) => HttpClient;
}

export const custom = <TIn = void, TOut = unknown>(
    handler: (ctx: CustomHandlerContext, input: TIn) => Promise<TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: () => (input: TIn) => handler({ getClient: resolveClient }, input)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEndpointDescriptor = EndpointDescriptor<any, any>;

type ResolvedEndpoints<T> = {
    [K in keyof T]: T[K] extends EndpointDescriptor<infer TIn, infer TOut> ? EndpointFn<TIn, TOut> : never;
};

export const createService = <T extends Record<string, AnyEndpointDescriptor>>(
    config: ServiceConfig,
    endpoints: T
): ResolvedEndpoints<T> => {
    const client = typeof config.client === 'string'
        ? resolveClient(config.client)
        : (config.client ?? registryClient);

    const ctx: ServiceContext = {
        client,
        basePath: config.basePath ?? ''
    };

    const result = {} as Record<string, unknown>;
    for (const [name, descriptor] of Object.entries(endpoints)) {
        if (!isEndpointDescriptor(descriptor)) {
            throw new Error(`Endpoint "${name}" is not a valid descriptor`);
        }
        result[name] = descriptor.build(ctx);
    }
    return result as ResolvedEndpoints<T>;
};
