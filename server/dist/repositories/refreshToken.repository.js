"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenRepository = void 0;
const db_1 = require("../config/db");
class RefreshTokenRepository {
    static tableName = "refreshToken";
    static async createRefreshTokenRecord(tokenHash, userId, expiration) {
        return await (0, db_1.insertAsync)(`INSERT INTO ${this.tableName} (tokenHash, userId, expiration) 
        VALUES (?, ?, ?)`, [tokenHash, userId, expiration]);
    }
    static async updateTokenRevokedStatus(tokenHash, isRevoked = 0, userId) {
        let userIdClause = "";
        let params = [isRevoked, tokenHash];
        if (userId) {
            userIdClause = "and userId = ?";
            params.push(userId);
        }
        return await (0, db_1.executeNonQueryAsync)(`UPDATE ${this.tableName} SET isRevoked = ?
        WHERE tokenHash = ? ${userIdClause}`, params);
    }
    static async queryByUserIdAndTokenHash(userId, tokenHash) {
        return await (0, db_1.queryFirstAsync)(`SELECT isRevoked FROM ${this.tableName} WHERE userId = ? AND tokenHash = ?`, [userId, tokenHash]);
    }
}
exports.RefreshTokenRepository = RefreshTokenRepository;
