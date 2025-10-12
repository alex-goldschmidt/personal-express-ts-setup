import {
  PracticeOne,
  PracticeOneDTO,
} from "../repositories/practiceone.repository";

export class PracticeService {
  static async getPractices(practiceId: number): Promise<PracticeOneDTO[]> {
    const result = await PracticeOne.queryListByPracticeId(practiceId);
    return result ?? [];
  }
}
