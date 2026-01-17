"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../config/db");
class UserRepository {
    static tableName = "user";
    static async queryAllUsers() {
        return await (0, db_1.queryListAsync)(`SELECT * FROM ${this.tableName}`);
    }
    static async queryByUserId(userId) {
        return await (0, db_1.queryFirstAsync)(`SELECT * FROM ${this.tableName} WHERE userId = ?`, [userId]);
    }
    static async queryByEmail(email) {
        return await (0, db_1.queryFirstAsync)(`SELECT userId, email, password FROM ${this.tableName} WHERE email = ?`, [email]);
    }
    static async createUser(newUser) {
        return await (0, db_1.insertAsync)(`INSERT INTO ${this.tableName} (email, password) 
      VALUES (?, ?)`, [newUser.email, newUser.password]);
    }
    static async deleteUser(userId) {
        return await (0, db_1.executeNonQueryAsync)(`DELETE FROM ${this.tableName} WHERE userId = ?`, [userId]);
    }
}
exports.UserRepository = UserRepository;
