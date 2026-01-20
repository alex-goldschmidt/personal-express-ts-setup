"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenPair = generateTokenPair;
exports.generateAccessToken = generateAccessToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const exceptions_1 = require("../config/exceptions");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function generateTokenPair(userId) {
    const payload = {
        sub: userId.toString(),
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
        algorithm: "HS256",
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
        algorithm: "HS256",
    });
    const tokens = {
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
    return tokens;
}
async function generateAccessToken(userId) {
    const payload = {
        sub: userId.toString(),
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
        algorithm: "HS256",
    });
    return accessToken;
}
async function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
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
