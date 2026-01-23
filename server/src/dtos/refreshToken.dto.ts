import { RowDataPacket } from "mysql2";
export interface RefreshToken extends RowDataPacket {
  refreshTokenId?: number;
  tokenHash: string;
  userId: number;
  isRevoked?: RevokedFlag;
  inserted?: string;
  updated?: string;
}

export type RevokedFlag = 0 | 1;
