import { ApiError } from '@/shared/errors/core';

export interface HttpClient {
    baseUrl: string;
    request<T>(method: string, path: string, init?: HttpRequestInit): Promise<T>;
}

export interface HttpRequestInit {
    body?: BodyInit | null;
    headers?: Record<string, string>;
    isJsonBody?: boolean;
    query?: Record<string, string | number | boolean | undefined | null>;
    signal?: AbortSignal;
}

const joinUrl = (baseUrl: string, path: string): string => {
    const left = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const right = path.startsWith('/') ? path : `/${path}`;
    return `${left}${right}`;
};

const appendQuery = (url: string, query?: HttpRequestInit['query']): string => {
    if (!query) return url;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        params.set(key, String(value));
    }
    const qs = params.toString();
    return qs.length > 0 ? `${url}?${qs}` : url;
};

const createHttpClient = (baseUrl: string): HttpClient => {
    return {
        baseUrl,
        async request<T>(method: string, path: string, init: HttpRequestInit = {}): Promise<T> {
            const headers: Record<string, string> = { ...(init.headers ?? {}) };

            if (init.isJsonBody && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }

            const url = appendQuery(joinUrl(baseUrl, path), init.query);

            const response = await fetch(url, {
                method,
                headers,
                body: init.body ?? null,
                signal: init.signal,
                credentials: 'omit'
            });

            const contentType = response.headers.get('content-type') ?? '';
            const isJson = contentType.includes('application/json');
            const payload = isJson
                ? await response.json().catch(() => null)
                : await response.text().catch(() => '');

            if (!response.ok) {
                const code = (isJson && payload && typeof payload === 'object' && 'code' in payload)
                    ? String((payload as { code: unknown }).code)
                    : `HTTP_${response.status}`;
                const message = (isJson && payload && typeof payload === 'object' && 'message' in payload)
                    ? String((payload as { message: unknown }).message)
                    : response.statusText || 'Request failed';
                throw new ApiError(message, code, response.status, payload);
            }

            return payload as T;
        }
    };
};

const REGISTRY_URL = import.meta.env.VITE_REGISTRY_URL ?? 'http://localhost:8082';

export const registryClient: HttpClient = createHttpClient(REGISTRY_URL);

export const getClient = (_name?: string): HttpClient => registryClient;
