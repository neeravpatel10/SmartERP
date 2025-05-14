"use strict";
/**
 * Custom error classes to be used across controllers
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ApiError = void 0;
/**
 * Base class for API errors with status code
 */
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.name = _this.constructor.name;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
/**
 * 400 Bad Request - Used when the request is malformed or invalid
 */
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message) {
        if (message === void 0) { message = 'Bad request'; }
        return _super.call(this, message, 400) || this;
    }
    return BadRequestError;
}(ApiError));
exports.BadRequestError = BadRequestError;
/**
 * 401 Unauthorized - Used when authentication is required but missing/invalid
 */
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message) {
        if (message === void 0) { message = 'Unauthorized'; }
        return _super.call(this, message, 401) || this;
    }
    return UnauthorizedError;
}(ApiError));
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 Forbidden - Used when user doesn't have permission for requested resource
 */
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError(message) {
        if (message === void 0) { message = 'Forbidden'; }
        return _super.call(this, message, 403) || this;
    }
    return ForbiddenError;
}(ApiError));
exports.ForbiddenError = ForbiddenError;
/**
 * 404 Not Found - Used when the requested resource doesn't exist
 */
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        if (message === void 0) { message = 'Resource not found'; }
        return _super.call(this, message, 404) || this;
    }
    return NotFoundError;
}(ApiError));
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict - Used when there's a conflict with the current state of resource
 */
var ConflictError = /** @class */ (function (_super) {
    __extends(ConflictError, _super);
    function ConflictError(message) {
        if (message === void 0) { message = 'Resource conflict'; }
        return _super.call(this, message, 409) || this;
    }
    return ConflictError;
}(ApiError));
exports.ConflictError = ConflictError;
/**
 * 422 Unprocessable Entity - Used for validation errors
 */
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message) {
        if (message === void 0) { message = 'Validation failed'; }
        return _super.call(this, message, 422) || this;
    }
    return ValidationError;
}(ApiError));
exports.ValidationError = ValidationError;
/**
 * 500 Internal Server Error - Used for unexpected server errors
 */
var InternalServerError = /** @class */ (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError(message) {
        if (message === void 0) { message = 'Internal server error'; }
        return _super.call(this, message, 500) || this;
    }
    return InternalServerError;
}(ApiError));
exports.InternalServerError = InternalServerError;
