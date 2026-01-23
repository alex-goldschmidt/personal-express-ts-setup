"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokenPair = generateTokenPair;
exports.generateAccessToken = generateAccessToken;
exports.verifyToken = verifyToken;
exports.handleRefreshToken = handleRefreshToken;
exports.createTokenHash = createTokenHash;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const exceptions_1 = require("../config/exceptions");
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const refreshToken_repository_1 = require("../repositories/refreshToken.repository");
dotenv_1.default.config();
async function generateTokenPair(userId) {
    const payload = {
        sub: userId.toString(),
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: "1minute",
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
async function handleRefreshToken(refreshToken, userId) {
    const hashedToken = await createTokenHash(refreshToken);
    await refreshToken_repository_1.RefreshTokenRepository.createRefreshTokenRecord(hashedToken, userId);
}
async function createTokenHash(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
