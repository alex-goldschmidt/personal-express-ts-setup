"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const exceptions_1 = require("../config/exceptions");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function authenticateToken(req, _res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader?.replace("Bearer ", "");
    if (!token) {
        throw new exceptions_1.UnauthorizedError("Missing token");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new exceptions_1.ForbiddenError("Token expired");
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new exceptions_1.ForbiddenError("Invalid token");
        }
        throw new exceptions_1.ForbiddenError("Authentication failed");
    }
}
