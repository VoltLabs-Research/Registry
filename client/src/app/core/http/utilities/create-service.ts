import { registryClient } from '@/app/core/http/utilities/create-client';
import type { HttpClient } from '@/app/core/http/utilities/create-client';

export interface ServiceConfig {
    client?: HttpClient;
}

interface EndpointOptions<TIn, TOut = unknown> {
    query?: (input: TIn) => Record<string, string | number | boolean | undefined | null>;
    map?: (payload: unknown) => TOut;
}

export type EndpointFn<TIn, TOut> = (input: TIn) => Promise<TOut>;

interface EndpointDescriptor<TIn, TOut> {
    __endpoint: true;
    build: (client: HttpClient) => EndpointFn<TIn, TOut>;
}

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

export const get = <TIn = void, TOut = unknown>(
    path: string,
    opts?: EndpointOptions<TIn, TOut>
): EndpointDescriptor<TIn, TOut> => ({
    __endpoint: true,
    build: (client) => async (input: TIn) => {
        const { path: filledPath, rest } = substitutePath(path, input);
        const fallbackQuery = Object.keys(rest).length > 0
            ? rest as Record<string, string | number | boolean | undefined | null>
            : undefined;

        const payload = await client.request<unknown>('GET', filledPath, {
            query: opts?.query ? opts.query(input) : fallbackQuery
        });

        return opts?.map ? opts.map(payload) : (payload as TOut);
    }
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
    const client = config.client ?? registryClient;

    const result = {} as Record<string, unknown>;
    for (const [name, descriptor] of Object.entries(endpoints)) {
        result[name] = descriptor.build(client);
    }
    return result as ResolvedEndpoints<T>;
};
