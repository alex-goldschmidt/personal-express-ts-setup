import { RowDataPacket } from "mysql2";
import { queryFirstAsync, queryListAsync } from "../config/db";
export interface PracticeOneDTO extends RowDataPacket {
  practiceId: number;
  name: string;
}

export class PracticeOne {
  static readonly tableName = "practiceOne";

  static async queryListByPracticeId(
    practiceId: number
  ): Promise<PracticeOneDTO[]> {
    return await queryListAsync<PracticeOneDTO>(
      `SELECT * FROM ${this.tableName} WHERE practiceId = ?`,
      [practiceId]
    );
  }

  static async queryFirstOrDefaultByPracticeId(
    practiceId: number
  ): Promise<PracticeOneDTO | null> {
    return await queryFirstAsync<PracticeOneDTO>(
      `SELECT * FROM ${this.tableName} WHERE practiceId = ?`,
      [practiceId]
    );
  }
}
