import { request, type Dispatcher } from 'undici';
import env from '@/core/config/env.js';
import logger from '@/core/config/logger.js';
import type {
    ConsoleGateway,
    ConsoleWhoamiResult
} from '@/modules/identity/domain/ConsoleGateway.js';

const MAX_RETRIES = 2;

const sleep = (milliseconds: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

export class HttpConsoleGateway implements ConsoleGateway {
    async whoami(authorization: string): Promise<ConsoleWhoamiResult> {
        const url = `${env.CONSOLE_URL}/auth/whoami`;

        let attempt = 0;
        let lastError: unknown = null;

        while (attempt <= MAX_RETRIES) {
            try {
                const response = await request(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: authorization
                    }
                });

                const body = await this.readJsonOrText(response);
                return { status: response.statusCode, body };
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
                if (attempt > MAX_RETRIES) {
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
