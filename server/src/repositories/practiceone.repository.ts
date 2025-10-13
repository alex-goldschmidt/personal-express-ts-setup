import {
  queryFirstAsync,
  queryListAsync,
  insertAsync,
  executeNonQueryAsync,
} from "../config/db";
import { PracticeOneDTO, PracticeOneRequestDTO } from "../dtos/practiceone.dto";

export class PracticeOneRepository {
  static readonly tableName = "practiceOne";

  static async queryAllPractices(): Promise<PracticeOneDTO[]> {
    return await queryListAsync<PracticeOneDTO>(
      `SELECT * FROM ${this.tableName}`
    );
  }

  static async queryByPracticeId(
    practiceId: number
  ): Promise<PracticeOneDTO | null> {
    return await queryFirstAsync<PracticeOneDTO>(
      `SELECT * FROM ${this.tableName} WHERE practiceId = ?`,
      [practiceId]
    );
  }

  static async createPractice(
    practice: PracticeOneRequestDTO
  ): Promise<number> {
    return await insertAsync(
      `INSERT INTO ${this.tableName} (name, description) 
      VALUES (?, ?)`,
      [practice.name, practice.description]
    );
  }

  static async updatePractice(
    practice: PracticeOneRequestDTO
  ): Promise<number> {
    return await executeNonQueryAsync(
      `UPDATE ${this.tableName} SET name = ?, description = ?
      WHERE practiceId = ?`,
      [practice.name, practice.description, practice.practiceId]
    );
  }

  static async deletePractice(practiceId: number): Promise<number> {
    return await executeNonQueryAsync(
      `DELETE FROM ${this.tableName} WHERE practiceId = ?`,
      [practiceId]
    );
  }
}
