"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
const userCreateInput_model_1 = require("../models/userCreateInput.model");
const errorValidator_1 = require("../utils/errorValidator");
const exceptions_1 = require("../config/exceptions");
class UserService {
    static async getUsers() {
        const result = await auth_repository_1.UserRepository.queryAllUsers();
        return result;
    }
    static async getSingleUserById(userId) {
        const result = await auth_repository_1.UserRepository.queryByUserId(userId);
        return result;
    }
    static async getSingleUserByEmail(email) {
        const result = await auth_repository_1.UserRepository.queryByEmail(email);
        return result;
    }
    static async createUser(newUser) {
        const validatedUser = (0, errorValidator_1.validateWithZod)(userCreateInput_model_1.UserCreateInputSchema, newUser);
        const isExistingUser = await auth_repository_1.UserRepository.queryByEmail(validatedUser.email);
        if (isExistingUser) {
            throw new exceptions_1.ConflictError("User with this email already exists.");
        }
        return await auth_repository_1.UserRepository.createUser(newUser);
    }
    static async deleteUser(userId) {
        return await auth_repository_1.UserRepository.deleteUser(userId);
    }
}
exports.UserService = UserService;
