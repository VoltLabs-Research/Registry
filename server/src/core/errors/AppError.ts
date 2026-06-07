export class AppError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(message: string, status = 500, code = 'INTERNAL', details?: unknown) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Not Found', details?: unknown) {
        super(message, 404, 'NOT_FOUND', details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', details?: unknown) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', details?: unknown) {
        super(message, 403, 'FORBIDDEN', details);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflict', details?: unknown) {
        super(message, 409, 'CONFLICT', details);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details?: unknown) {
        super(message, 422, 'VALIDATION_FAILED', details);
    }
}

export class NotImplementedError extends AppError {
    constructor(message = 'Not Implemented', details?: unknown) {
        super(message, 501, 'NOT_IMPLEMENTED', details);
    }
}
