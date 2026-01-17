import {
  queryFirstAsync,
  queryListAsync,
  insertAsync,
  executeNonQueryAsync,
} from "../config/db";
import { User } from "../dtos/auth.dto";
export class UserRepository {
  static readonly tableName = "user";

  static async queryAllUsers(): Promise<User[]> {
    return await queryListAsync<User>(`SELECT * FROM ${this.tableName}`);
  }

  static async queryByUserId(userId: number): Promise<User | null> {
    return await queryFirstAsync<User>(
      `SELECT * FROM ${this.tableName} WHERE userId = ?`,
      [userId]
    );
  }

  static async queryByEmail(email: string): Promise<User | null> {
    return await queryFirstAsync<User>(
      `SELECT userId, email FROM ${this.tableName} WHERE email = ?`,
      [email]
    );
  }

  static async createUser(newUser: User): Promise<number> {
    return await insertAsync(
      `INSERT INTO ${this.tableName} (email, password) 
      VALUES (?, ?)`,
      [newUser.email, newUser.password]
    );
  }

  static async deleteUser(userId: number): Promise<number> {
    return await executeNonQueryAsync(
      `DELETE FROM ${this.tableName} WHERE userId = ?`,
      [userId]
    );
  }
}
