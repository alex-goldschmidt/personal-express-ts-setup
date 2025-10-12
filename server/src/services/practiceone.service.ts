import { PracticeOneRepository } from "../repositories/practiceone.repository";
import { PracticeOneDTO, PracticeOneRequestDTO } from "../dtos/practiceone.dto";

export class PracticeService {
  static async getPractices(): Promise<PracticeOneDTO[]> {
    const result = await PracticeOneRepository.queryAllPractices();
    return result ?? [];
  }

  static async getSinglePractice(
    practiceId: number
  ): Promise<PracticeOneDTO | null> {
    const result = await PracticeOneRepository.queryByPracticeId(practiceId);
    return result ?? null;
  }

  static async createPractice(
    practice: PracticeOneRequestDTO
  ): Promise<number> {
    return await PracticeOneRepository.createPractice(practice);
  }

  static async updatePractice(
    practice: PracticeOneRequestDTO
  ): Promise<number> {
    return await PracticeOneRepository.updatePractice(practice);
  }

  static async deletePractice(practiceId: number): Promise<number> {
    return await PracticeOneRepository.deletePractice(practiceId);
  }
}
