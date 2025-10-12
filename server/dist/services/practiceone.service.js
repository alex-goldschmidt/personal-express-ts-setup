"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeService = void 0;
const practiceone_repository_1 = require("../repositories/practiceone.repository");
class PracticeService {
    static async getPractices() {
        const result = await practiceone_repository_1.PracticeOneRepository.queryAllPractices();
        return result ?? [];
    }
    static async getSinglePractice(practiceId) {
        const result = await practiceone_repository_1.PracticeOneRepository.queryByPracticeId(practiceId);
        return result ?? null;
    }
    static async createPractice(practice) {
        return await practiceone_repository_1.PracticeOneRepository.createPractice(practice);
    }
    static async updatePractice(practice) {
        return await practiceone_repository_1.PracticeOneRepository.updatePractice(practice);
    }
    static async deletePractice(practiceId) {
        return await practiceone_repository_1.PracticeOneRepository.deletePractice(practiceId);
    }
}
exports.PracticeService = PracticeService;
