export interface ConsoleWhoamiResult {
    status: number;
    body: unknown;
}

/**
 * Outbound port to the console service. Implementations live in infrastructure
 * and own the transport details (HTTP, retries, parsing).
 */
export interface ConsoleGateway {
    whoami(authorization: string): Promise<ConsoleWhoamiResult>;
}
