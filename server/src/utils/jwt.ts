import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ForbiddenError } from "../config/exceptions";
import dotenv from "dotenv";
import crypto from "crypto";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository";
import { Response } from "express";
dotenv.config();

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiration: Date;
}

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    refreshTokenExpiration: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
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

export async function handleRefreshToken(
  refreshToken: string,
  userId: number,
  expiration: Date
) {
  const hashedToken = await createTokenHash(refreshToken);

  await RefreshTokenRepository.createRefreshTokenRecord(
    hashedToken,
    userId,
    expiration
  );
}

export async function createTokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  refreshTokenExpiresAt: Date
): Promise<void> {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: Math.max(refreshTokenExpiresAt.getTime() - Date.now(), 0),
  });
}

export async function clearRefreshTokenCookie(res: Response): Promise<void> {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
}
