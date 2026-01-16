"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const auth_repository_1 = require("../repositories/auth.repository");
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
    static async createUser(user) {
        return await auth_repository_1.UserRepository.createUser(user);
    }
    static async deleteUser(userId) {
        return await auth_repository_1.UserRepository.deleteUser(userId);
    }
}
exports.UserService = UserService;
