import {
  executeNonQueryAsync,
  insertAsync,
  queryFirstAsync,
} from "../config/db";
import { RefreshToken, RevokedFlag } from "../dtos/refreshToken.dto";

export class RefreshTokenRepository {
  static readonly tableName = "refreshTokens";

  static async createRefreshTokenRecord(
    tokenHash: string,
    userId: number
  ): Promise<number> {
    return await insertAsync(
      `INSERT INTO ${this.tableName} (tokenHash, userId) 
        VALUES (?, ?)`,
      [tokenHash, userId]
    );
  }

  static async updateTokenRevokedStatus(
    tokenHash: string,
    isRevoked: RevokedFlag = 0,
    userId?: number
  ): Promise<number> {
    let userIdClause = "";
    let params: (string | RevokedFlag | number)[] = [isRevoked, tokenHash];
    if (userId) {
      userIdClause = "and userId = ?";
      params.push(userId);
    }

    return await executeNonQueryAsync(
      `UPDATE ${this.tableName} SET isRevoked = ?
        WHERE tokenHash = ? ${userIdClause}`,
      params
    );
  }

  static async queryByUserIdAndTokenHash(
    userId: number,
    tokenHash: string
  ): Promise<RefreshToken | null> {
    return await queryFirstAsync<RefreshToken>(
      `SELECT isRevoked FROM ${this.tableName} WHERE userId = ? AND tokenHash = ?`,
      [userId, tokenHash]
    );
  }
}
