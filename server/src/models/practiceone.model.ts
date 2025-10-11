import { QueryResult, RowDataPacket } from "mysql2";
import db, { queryFirstOrDefault, queryListAsync } from "../config/db";
export interface PracticeOneDTO extends RowDataPacket {
  practiceId: number;
  name: string;
}

const tableName = "practiceOne";

export class PracticeOne {
  static async queryListByPracticeId(
    practiceId: number
  ): Promise<PracticeOneDTO[]> {
    return await queryListAsync<PracticeOneDTO>(
      `SELECT * FROM ${tableName} WHERE practiceId = ?`,
      [practiceId]
    );
  }

  static async queryFirstOrDefaultByPracticeId(
    practiceId: number
  ): Promise<PracticeOneDTO | null> {
    return await queryFirstOrDefault<PracticeOneDTO>(
      `SELECT * FROM ${tableName} WHERE practiceId = ?`,
      [practiceId]
    );
  }
}
