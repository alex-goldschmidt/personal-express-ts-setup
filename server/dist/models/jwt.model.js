"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const JWTPayloadSchema = zod_1.default.object({
    userId: zod_1.default.int().positive(),
    iat: zod_1.default.int().positive(),
    exp: zod_1.default.int().positive(),
});
const JWTSchema = zod_1.default.jwt({ alg: "HS256" });
