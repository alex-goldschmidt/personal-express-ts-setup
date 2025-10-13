"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeOneRepository = void 0;
const db_1 = require("../config/db");
class PracticeOneRepository {
    static tableName = "practiceOne";
    static async queryAllPractices() {
        return await (0, db_1.queryListAsync)(`SELECT * FROM ${this.tableName}`);
    }
    static async queryByPracticeId(practiceId) {
        return await (0, db_1.queryFirstAsync)(`SELECT * FROM ${this.tableName} WHERE practiceId = ?`, [practiceId]);
    }
    static async createPractice(practice) {
        return await (0, db_1.insertAsync)(`INSERT INTO ${this.tableName} (name, description) 
      VALUES (?, ?)`, [practice.name, practice.description]);
    }
    static async updatePractice(practice) {
        return await (0, db_1.executeNonQueryAsync)(`UPDATE ${this.tableName} SET name = ?, description = ?
      WHERE practiceId = ?`, [practice.name, practice.description, practice.practiceId]);
    }
    static async deletePractice(practiceId) {
        return await (0, db_1.executeNonQueryAsync)(`DELETE FROM ${this.tableName} WHERE practiceId = ?`, [practiceId]);
    }
}
exports.PracticeOneRepository = PracticeOneRepository;
