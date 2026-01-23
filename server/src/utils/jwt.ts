import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ForbiddenError } from "../config/exceptions";
import dotenv from "dotenv";
import crypto from "crypto";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository";
dotenv.config();

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function generateTokenPair(userId: number): Promise<TokenPair> {
  const payload: JwtPayload = {
    sub: userId.toString(),
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: "15m",
      algorithm: "HS256",
    }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );

  const tokens: TokenPair = {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };

  return tokens;
}

export async function generateAccessToken(userId: number): Promise<string> {
  const payload: JwtPayload = {
    sub: userId.toString(),
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: "15m",
      algorithm: "HS256",
    }
  );

  return accessToken;
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_TOKEN_SECRET as Secret
    ) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ForbiddenError("Token expired");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new ForbiddenError("Invalid token");
    }
    throw new ForbiddenError("Authentication failed");
  }
}

export async function handleRefreshToken(refreshToken: string, userId: number) {
  const hashedToken = await createTokenHash(refreshToken);

  await RefreshTokenRepository.createRefreshTokenRecord(hashedToken, userId);
}

export async function createTokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
