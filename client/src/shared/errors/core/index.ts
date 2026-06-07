export { ApiError, getErrorMessage } from '@/shared/errors/core/api-error';
export { reportError } from '@/shared/errors/core/report-error';
export {
    isAccessDeniedCode,
    isAccessDeniedError,
    isApiError,
    markApiErrorHandled,
    resolveErrorTitle
} from '@/shared/errors/core/report-error';
export {
    ErrorSurface
} from '@/shared/errors/core/types';
export type {
    ReportErrorOptions,
    UserFacingError
} from '@/shared/errors/core/types';
