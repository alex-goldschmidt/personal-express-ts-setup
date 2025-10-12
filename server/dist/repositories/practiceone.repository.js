"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeOne = void 0;
const db_1 = require("../config/db");
class PracticeOne {
    static tableName = "practiceOne";
    static async queryListByPracticeId(practiceId) {
        return await (0, db_1.queryListAsync)(`SELECT * FROM ${this.tableName} WHERE practiceId = ?`, [practiceId]);
    }
    static async queryFirstOrDefaultByPracticeId(practiceId) {
        return await (0, db_1.queryFirstAsync)(`SELECT * FROM ${this.tableName} WHERE practiceId = ?`, [practiceId]);
    }
}
exports.PracticeOne = PracticeOne;
