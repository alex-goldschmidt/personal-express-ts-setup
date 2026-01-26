import { Request, Response } from "express";
import { verify } from "@node-rs/argon2";
import { UserService } from "../../src/services/auth.service";
import { UserRepository } from "../../src/repositories/auth.repository";
import { RefreshTokenRepository } from "../../src/repositories/refreshToken.repository";
import { User } from "../../src/dtos/auth.dto";
import { UserInput } from "../../src/models/userCreateInput.model";
import { validateWithZod } from "../../src/utils/errorValidator";
import {
  clearRefreshTokenCookie,
  createTokenHash,
  generateTokenPair,
  handleRefreshToken,
  TokenPair,
  verifyToken,
} from "../../src/utils/jwt";
import { hashPassword } from "../../src/utils/password";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../../src/config/exceptions";
import { RefreshToken } from "../../src/dtos/refreshToken.dto";
import { JwtPayload } from "jsonwebtoken";

jest.mock("../../src/repositories/auth.repository.ts");
jest.mock("../../src/repositories/refreshToken.repository.ts");
jest.mock("../../src/utils/errorValidator");
jest.mock("../../src/utils/password");
jest.mock("@node-rs/argon2", () => ({ verify: jest.fn() }));
jest.mock("../../src/utils/jwt", () => ({
  generateTokenPair: jest.fn(),
  handleRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
  createTokenHash: jest.fn(),
  clearRefreshTokenCookie: jest.fn(),
}));

const mockedUserRepo = UserRepository as jest.Mocked<typeof UserRepository>;
const mockedRefreshRepo = RefreshTokenRepository as jest.Mocked<
  typeof RefreshTokenRepository
>;
const mockedValidateWithZod = validateWithZod as jest.MockedFunction<
  typeof validateWithZod
>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGenerateTokenPair = generateTokenPair as jest.MockedFunction<
  typeof generateTokenPair
>;
const mockedHandleRefreshToken = handleRefreshToken as jest.MockedFunction<
  typeof handleRefreshToken
>;
const mockedVerifyToken = verifyToken as jest.MockedFunction<
  typeof verifyToken
>;
const mockedCreateTokenHash = createTokenHash as jest.MockedFunction<
  typeof createTokenHash
>;
const mockedClearRefreshTokenCookie =
  clearRefreshTokenCookie as jest.MockedFunction<
    typeof clearRefreshTokenCookie
  >;
const mockedHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;

describe("UserService", () => {
  beforeEach(() => {
    mockedValidateWithZod.mockImplementation(
      (_schema, data) => data as UserInput
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("gets user by user id", async () => {
    const fake = {
      userId: 1,
      email: "test@email.com",
      password: "hash",
      inserted: "2026-01-17 09:02:58",
      updated: "2026-01-17 09:02:58",
    } as User;
    mockedUserRepo.queryByUserId.mockResolvedValueOnce(fake as User);

    const userInDb = await UserService.getSingleUserById(1);
    expect(userInDb).toEqual(fake);
    expect(mockedUserRepo.queryByUserId).toHaveBeenCalledWith(1);
  });

  describe("signIn", () => {
    const userInput: UserInput = {
      email: "john@example.com",
      password: "Password123",
    };

    it("returns a token pair for valid credentials", async () => {
      const userInDb = { userId: 7, email: userInput.email, password: "hash" };
      const tokens: TokenPair = {
        accessToken: "access123",
        refreshToken: "refresh123",
      };

      mockedUserRepo.queryByEmail.mockResolvedValueOnce(userInDb as User);
      mockedVerify.mockResolvedValueOnce(true);
      mockedGenerateTokenPair.mockResolvedValueOnce(tokens);

      const result = await UserService.signIn(userInput);

      expect(result).toEqual(tokens);
      expect(mockedValidateWithZod).toHaveBeenCalledWith(
        expect.anything(),
        userInput
      );
      expect(mockedUserRepo.queryByEmail).toHaveBeenCalledWith(userInput.email);
      expect(mockedVerify).toHaveBeenCalledWith("hash", userInput.password);
      expect(mockedHandleRefreshToken).toHaveBeenCalledWith(
        tokens.refreshToken,
        userInDb.userId
      );
    });

    it("throws UnauthorizedError when email is not found", async () => {
      mockedUserRepo.queryByEmail.mockResolvedValueOnce(null);

      await expect(UserService.signIn(userInput)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(mockedVerify).not.toHaveBeenCalled();
      expect(mockedGenerateTokenPair).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedError when password is incorrect", async () => {
      mockedUserRepo.queryByEmail.mockResolvedValueOnce({
        userId: 2,
        email: userInput.email,
        password: "hash",
      } as User);
      mockedVerify.mockResolvedValueOnce(false);

      await expect(UserService.signIn(userInput)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(mockedGenerateTokenPair).not.toHaveBeenCalled();
    });
  });

  describe("refreshAccessToken", () => {
    it("returns a new token pair and revokes the old refresh token", async () => {
      const req = {
        cookies: { refreshToken: "oldToken" },
      } as unknown as Request;
      const tokens: TokenPair = {
        accessToken: "newAccess",
        refreshToken: "newRefresh",
      };

      mockedVerifyToken.mockResolvedValueOnce({ sub: "10" } as JwtPayload);
      mockedCreateTokenHash.mockResolvedValueOnce("oldHash");
      mockedRefreshRepo.queryByUserIdAndTokenHash.mockResolvedValueOnce({
        userId: 10,
        tokenHash: "oldHash",
        isRevoked: 0,
      } as RefreshToken);
      mockedRefreshRepo.updateTokenRevokedStatus.mockResolvedValueOnce(1);
      mockedGenerateTokenPair.mockResolvedValueOnce(tokens);

      const result = await UserService.refreshAccessToken(req);

      expect(result).toEqual(tokens);
      expect(mockedVerifyToken).toHaveBeenCalledWith("oldToken");
      expect(mockedCreateTokenHash).toHaveBeenCalledWith("oldToken");
      expect(mockedRefreshRepo.updateTokenRevokedStatus).toHaveBeenCalledWith(
        "oldHash",
        1,
        10
      );
      expect(mockedHandleRefreshToken).toHaveBeenCalledWith(
        tokens.refreshToken,
        10
      );
    });

    it("throws UnauthorizedError when refresh token cookie is missing", async () => {
      const req = { cookies: {} } as unknown as Request;

      await expect(UserService.refreshAccessToken(req)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedError when token is not stored", async () => {
      const req = {
        cookies: { refreshToken: "oldToken" },
      } as unknown as Request;

      mockedVerifyToken.mockResolvedValueOnce({ sub: "5" } as JwtPayload);
      mockedCreateTokenHash.mockResolvedValueOnce("hash");
      mockedRefreshRepo.updateTokenRevokedStatus.mockResolvedValueOnce(1);
      mockedRefreshRepo.queryByUserIdAndTokenHash.mockResolvedValueOnce(null);

      await expect(UserService.refreshAccessToken(req)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });

    it("throws ForbiddenError when token has been revoked", async () => {
      const req = {
        cookies: { refreshToken: "oldToken" },
      } as unknown as Request;

      mockedVerifyToken.mockResolvedValueOnce({ sub: "3" } as JwtPayload);
      mockedCreateTokenHash.mockResolvedValueOnce("hash");
      mockedRefreshRepo.queryByUserIdAndTokenHash.mockResolvedValueOnce({
        userId: 3,
        tokenHash: "hash",
        isRevoked: 1,
      } as RefreshToken);

      await expect(UserService.refreshAccessToken(req)).rejects.toBeInstanceOf(
        ForbiddenError
      );
      expect(mockedRefreshRepo.updateTokenRevokedStatus).not.toHaveBeenCalled();
    });

    it("throws UnauthorizedError when token subject is invalid", async () => {
      const req = {
        cookies: { refreshToken: "token" },
      } as unknown as Request;

      mockedVerifyToken.mockResolvedValueOnce({ sub: undefined } as JwtPayload);

      await expect(UserService.refreshAccessToken(req)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  describe("logout", () => {
    it("clears cookie and returns true when no refresh token exists", async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = { clearCookie: jest.fn() } as unknown as Response;

      const result = await UserService.logout(req, res);

      expect(result).toBe(true);
      expect(mockedClearRefreshTokenCookie).toHaveBeenCalledWith(res);
      expect(mockedRefreshRepo.updateTokenRevokedStatus).not.toHaveBeenCalled();
    });

    it("revokes token, clears cookie and returns true when refresh token is present", async () => {
      const req = {
        cookies: { refreshToken: "oldToken" },
      } as unknown as Request;
      const res = { clearCookie: jest.fn() } as unknown as Response;

      mockedCreateTokenHash.mockResolvedValueOnce("hash");

      const result = await UserService.logout(req, res);

      expect(result).toBe(true);
      expect(mockedCreateTokenHash).toHaveBeenCalledWith("oldToken");
      expect(mockedRefreshRepo.updateTokenRevokedStatus).toHaveBeenCalledWith(
        "hash",
        1
      );
      expect(mockedClearRefreshTokenCookie).toHaveBeenCalledWith(res);
    });
  });

  describe("createUser", () => {
    const input: UserInput = {
      email: "new@example.com",
      password: "Password123",
    };

    it("hashes password, creates user, and returns true", async () => {
      mockedUserRepo.queryByEmail.mockResolvedValueOnce(null);
      mockedHashPassword.mockResolvedValueOnce("hashedPw");
      mockedUserRepo.createUser.mockResolvedValueOnce(1);

      const result = await UserService.createUser({ ...input });

      expect(result).toBe(true);
      expect(mockedHashPassword).toHaveBeenCalledWith(input.password);
      expect(mockedUserRepo.createUser).toHaveBeenCalledWith({
        email: input.email,
        password: "hashedPw",
      });
    });

    it("throws ConflictError when user already exists", async () => {
      mockedUserRepo.queryByEmail.mockResolvedValueOnce({
        userId: 1,
        email: input.email,
        password: "existing",
      } as User);

      await expect(UserService.createUser(input)).rejects.toBeInstanceOf(
        ConflictError
      );
      expect(mockedHashPassword).not.toHaveBeenCalled();
    });
  });

  it("deletes user by id", async () => {
    mockedUserRepo.deleteUser.mockResolvedValueOnce(1);

    const result = await UserService.deleteUser(5);

    expect(result).toBe(1);
    expect(mockedUserRepo.deleteUser).toHaveBeenCalledWith(5);
  });
});
