"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
const errorValidator_1 = require("../utils/errorValidator");
const exceptions_1 = require("../config/exceptions");
const password_1 = require("../utils/password");
const userCreateInput_model_1 = require("../models/userCreateInput.model");
const argon2_1 = require("@node-rs/argon2");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class UserService {
    static async getSingleUserById(userId) {
        const result = await auth_repository_1.UserRepository.queryByUserId(userId);
        return result;
    }
    static async signIn(userInput) {
        const validatedUser = (0, errorValidator_1.validateWithZod)(userCreateInput_model_1.UserInputSchema, userInput);
        const existingUser = await auth_repository_1.UserRepository.queryByEmail(validatedUser.email);
        if (!existingUser) {
            throw new exceptions_1.UnauthorizedError("No user with this email exists. Please sign up.");
        }
        const isPasswordValid = await (0, argon2_1.verify)(existingUser.password, validatedUser.password);
        if (!isPasswordValid) {
            throw new exceptions_1.UnauthorizedError("Incorrect password. Please try again.");
        }
        const jwtPayload = {
            sub: existingUser.userId?.toString(),
        };
        const signedToken = jsonwebtoken_1.default.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: "15m",
            algorithm: "HS256",
        });
        return signedToken;
    }
    static async createUser(userInput) {
        const validatedUser = (0, errorValidator_1.validateWithZod)(userCreateInput_model_1.UserInputSchema, userInput);
        const isExistingUser = await auth_repository_1.UserRepository.queryByEmail(validatedUser.email);
        if (isExistingUser) {
            throw new exceptions_1.ConflictError("User with this email already exists.");
        }
        userInput.password = await (0, password_1.hashPassword)(userInput.password);
        const user = {
            email: userInput.email,
            password: userInput.password,
        };
        return (await auth_repository_1.UserRepository.createUser(user)) > 0;
    }
    static async deleteUser(userId) {
        return await auth_repository_1.UserRepository.deleteUser(userId);
    }
}
exports.UserService = UserService;
