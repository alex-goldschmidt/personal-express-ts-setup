"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeUserId = authorizeUserId;
const exceptions_1 = require("../config/exceptions");
/**
 * Authorization middleware that verifies the authenticated user
 * has permission to access the requested resource.
 *
 * This middleware should be used AFTER authenticateToken middleware.
 * It checks if the authenticated user matches the userId in the route params.
 */
function authorizeUserId(req, _res, next) {
    const authenticatedUserId = parseInt(req.user.sub ?? "");
    const requestedUserId = parseInt(req.params.userId);
    if (!Number.isInteger(authenticatedUserId) ||
        !Number.isInteger(requestedUserId)) {
        throw new exceptions_1.UnauthorizedError("Invalid user identifier");
    }
    if (authenticatedUserId !== requestedUserId) {
        throw new exceptions_1.ForbiddenError("You are not authorized to access this user");
    }
    next();
}
