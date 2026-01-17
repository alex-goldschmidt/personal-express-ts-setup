"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const exceptions_1 = require("../config/exceptions");
function errorHandler(err, req, res, _next) {
    if (err instanceof exceptions_1.AppError) {
        if (err.statusCode >= 500 /* HttpStatusCode.SERVER_ERROR */) {
            console.error("Operational server error:", {
                message: err.message,
                statusCode: err.statusCode,
                path: req.originalUrl,
                method: req.method,
            });
        }
        else {
            console.warn("Client error:", err.message);
        }
    }
    else {
        console.error("Unhandled error:", err);
    }
    let response = {
        statusCode: 500 /* HttpStatusCode.SERVER_ERROR */,
        message: "Internal server error",
    };
    if (err instanceof exceptions_1.AppError) {
        response = {
            statusCode: err.statusCode,
            message: err.message,
        };
        if (err.errors?.length) {
            response.errors = err.errors;
        }
    }
    if (req.app.get("env") === "development") {
        response.stack =
            err instanceof Error || err instanceof exceptions_1.AppError ? err.stack : undefined;
    }
    res.status(response.statusCode).json(response);
}
