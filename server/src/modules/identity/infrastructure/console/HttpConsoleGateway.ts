import { request, type Dispatcher } from 'undici';
import env from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import type {
    ConsoleGateway,
    ConsoleWhoamiResult
} from '@/modules/identity/domain/ConsoleGateway.js';

interface ConsoleCall {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
    retries?: number;
}

interface ConsoleCallResult {
    status: number;
    body: unknown;
}

const sleep = (milliseconds: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

export class HttpConsoleGateway implements ConsoleGateway {
    async whoami(authorization: string): Promise<ConsoleWhoamiResult> {
        const result = await this.call({
            method: 'GET',
            path: '/auth/whoami',
            headers: { Authorization: authorization }
        });
        return { status: result.status, body: result.body };
    }

    private async call(input: ConsoleCall): Promise<ConsoleCallResult> {
        const maxRetries = input.retries ?? 2;
        const url = `${env.CONSOLE_URL}${input.path}`;

        let attempt = 0;
        let lastError: unknown = null;

        while (attempt <= maxRetries) {
            try {
                const response = await request(url, {
                    method: input.method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...input.headers
                    },
                    body: input.body !== undefined ? JSON.stringify(input.body) : undefined
                });

                const body = await this.readJsonOrText(response);
                return {
                    status: response.statusCode,
                    body
                };
            } catch (error) {
                lastError = error;
                logger.warn(
                    {
                        attempt,
                        err: error instanceof Error ? error.message : String(error),
                        url
                    },
                    'console call failed'
                );
                attempt += 1;
                if (attempt > maxRetries) {
                    break;
                }
                await sleep(150 * attempt);
            }
        }

        throw lastError instanceof Error ? lastError : new Error('Console request failed');
    }

    private async readJsonOrText(response: Dispatcher.ResponseData): Promise<unknown> {
        const text = await response.body.text();
        if (!text) {
            return null;
        }
        const contentType = String(response.headers['content-type'] ?? '');
        if (contentType.includes('application/json')) {
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        }
        return text;
    }
}
