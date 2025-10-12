"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeService = void 0;
const practiceone_repository_1 = require("../repositories/practiceone.repository");
class PracticeService {
    static async getPractices(practiceId) {
        const result = await practiceone_repository_1.PracticeOne.queryListByPracticeId(practiceId);
        return result ?? [];
    }
}
exports.PracticeService = PracticeService;
