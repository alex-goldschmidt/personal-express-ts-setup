import { UserRepository } from "../repositories/auth.repository";
import { User } from "../dtos/auth.dto";
import { validateWithZod } from "../utils/errorValidator";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../config/exceptions";
import { hashPassword } from "../utils/password";
import { UserInput, UserInputSchema } from "../models/userCreateInput.model";
import { verify } from "@node-rs/argon2";
import { Request } from "express";
import {
  clearRefreshTokenCookie,
  createTokenHash,
  generateTokenPair,
  handleRefreshToken,
  TokenPair,
  verifyToken,
} from "../utils/jwt";
import dotenv from "dotenv";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository";
dotenv.config();
import { Response } from "express";

export class UserService {
  static async getSingleUserById(userId: number): Promise<User | null> {
    const result = await UserRepository.queryByUserId(userId);
    return result;
  }

  static async signIn(userInput: UserInput): Promise<TokenPair> {
    const validatedUser = validateWithZod(UserInputSchema, userInput);
    const existingUser = await UserRepository.queryByEmail(validatedUser.email);

    if (!existingUser) {
      throw new UnauthorizedError(
        "No user with this email exists. Please sign up."
      );
    }

    const isPasswordValid = await verify(
      existingUser.password,
      validatedUser.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Incorrect password. Please try again.");
    }

    const accessTokens = await generateTokenPair(existingUser.userId);

    await handleRefreshToken(accessTokens.refreshToken, existingUser.userId);

    return accessTokens;
  }

  static async refreshAccessToken(req: Request): Promise<TokenPair> {
    const oldRefreshToken = req.cookies?.["refreshToken"] as string;

    if (!oldRefreshToken) {
      throw new UnauthorizedError("Missing Token");
    }

    const decoded = await verifyToken(oldRefreshToken);

    const userId = parseInt(decoded.sub!);

    if (!userId || userId < 0) {
      throw new UnauthorizedError("Invalid user identifier in token");
    }

    const oldRefreshTokenHash = await createTokenHash(oldRefreshToken);
    const refreshTokenInDb =
      await RefreshTokenRepository.queryByUserIdAndTokenHash(
        userId,
        oldRefreshTokenHash
      );

    if (!refreshTokenInDb) {
      throw new UnauthorizedError("Invalid Token");
    }

    if (refreshTokenInDb.isRevoked === 1) {
      throw new ForbiddenError("Token was revoked");
    }

    await RefreshTokenRepository.updateTokenRevokedStatus(
      oldRefreshTokenHash,
      1,
      userId
    );

    const newTokenPair = await generateTokenPair(userId);

    await handleRefreshToken(newTokenPair.refreshToken, userId);

    return newTokenPair;
  }

  static async logout(req: Request, res: Response): Promise<boolean> {
    const oldRefreshToken = req.cookies?.["refreshToken"] as string;

    if (!oldRefreshToken) {
      await clearRefreshTokenCookie(res);
      return true;
    }
    const tokenHash = await createTokenHash(oldRefreshToken);

    await RefreshTokenRepository.updateTokenRevokedStatus(tokenHash, 1);

    await clearRefreshTokenCookie(res);

    return true;
  }

  static async createUser(userInput: UserInput): Promise<boolean> {
    const validatedUser = validateWithZod(UserInputSchema, userInput);
    const isExistingUser = await UserRepository.queryByEmail(
      validatedUser.email
    );

    if (isExistingUser) {
      throw new ConflictError("User with this email already exists.");
    }

    userInput.password = await hashPassword(userInput.password);

    const user = {
      email: userInput.email,
      password: userInput.password,
    } as User;

    return (await UserRepository.createUser(user)) > 0;
  }

  static async deleteUser(userId: number): Promise<number> {
    return await UserRepository.deleteUser(userId);
  }
}
