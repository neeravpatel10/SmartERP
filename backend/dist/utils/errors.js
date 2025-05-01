"use strict";
/**
 * Custom error classes to be used across controllers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ApiError = void 0;
/**
 * Base class for API errors with status code
 */
class ApiError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
/**
 * 400 Bad Request - Used when the request is malformed or invalid
 */
class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * 401 Unauthorized - Used when authentication is required but missing/invalid
 */
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 Forbidden - Used when user doesn't have permission for requested resource
 */
class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * 404 Not Found - Used when the requested resource doesn't exist
 */
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict - Used when there's a conflict with the current state of resource
 */
class ConflictError extends ApiError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
/**
 * 422 Unprocessable Entity - Used for validation errors
 */
class ValidationError extends ApiError {
    constructor(message = 'Validation failed') {
        super(message, 422);
    }
}
exports.ValidationError = ValidationError;
/**
 * 500 Internal Server Error - Used for unexpected server errors
 */
class InternalServerError extends ApiError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
