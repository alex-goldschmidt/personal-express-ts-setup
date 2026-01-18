"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.ConflictError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    errors;
    constructor(statusCode, message, errors = []) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(errors) {
        super(400 /* HttpStatusCode.BAD_REQUEST */, "Validation failed", errors);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super(404 /* HttpStatusCode.NOT_FOUND */, message);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401 /* HttpStatusCode.UNAUTHORIZED */, message);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ConflictError extends AppError {
    constructor(message) {
        super(409 /* HttpStatusCode.CONFLICT */, message);
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
class ForbiddenError extends AppError {
    constructor(message) {
        super(403 /* HttpStatusCode.FORBIDDEN */, message);
        this.name = "ForbiddenError";
    }
}
exports.ForbiddenError = ForbiddenError;
