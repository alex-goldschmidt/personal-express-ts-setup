"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeOne = void 0;
const db_1 = require("../config/db");
const tableName = "practiceOne";
class PracticeOne {
    static async queryListByPracticeId(practiceId) {
        return await (0, db_1.queryListAsync)(`SELECT * FROM ${tableName} WHERE practiceId = ?`, [practiceId]);
    }
    static async queryFirstOrDefaultByPracticeId(practiceId) {
        return await (0, db_1.queryFirstOrDefault)(`SELECT * FROM ${tableName} WHERE practiceId = ?`, [practiceId]);
    }
}
exports.PracticeOne = PracticeOne;
