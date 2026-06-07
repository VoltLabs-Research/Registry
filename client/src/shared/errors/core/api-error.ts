const PERMISSION_DENIED_CODES = new Set([
    'PERMISSION_DENIED',
    'FORBIDDEN',
    'UNAUTHORIZED'
]);

export class ApiError extends Error {
    code: string;
    status: number;
    details?: unknown;
    private handled = false;

    constructor(message: string, code: string, status: number, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }

    static isCodePermissionDenied(code: string): boolean {
        return PERMISSION_DENIED_CODES.has(code);
    }

    isPermissionDenied(): boolean {
        return ApiError.isCodePermissionDenied(this.code);
    }

    markHandled(): void {
        this.handled = true;
    }

    isHandled(): boolean {
        return this.handled;
    }
}

const ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    UNAUTHORIZED: 'You must sign in to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    NOT_IMPLEMENTED: 'This action is not yet enabled.'
};

export const getErrorMessage = (code: string, fallback: string): string => {
    return ERROR_MESSAGES[code] ?? fallback;
};
