import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "../../src/constants/constants";
import {
  signUp,
  getUserById,
  signIn,
  refreshToken,
  logout,
  UserParams,
} from "../../src/controllers/auth.controller";
import { UserService } from "../../src/services/auth.service";
import executeSafely from "../../src/utils/executeSafely";
import { TokenPair } from "../../src/utils/jwt";
import { UserInput } from "../../src/models/userCreateInput.model";
import { User } from "../../src/dtos/auth.dto";

jest.mock("../../src/services/auth.service", () => ({
  UserService: {
    createUser: jest.fn(),
    getSingleUserById: jest.fn(),
    signIn: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
    deleteUser: jest.fn(),
  },
}));
jest.mock("../../src/utils/executeSafely", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedExecuteSafely = executeSafely as jest.MockedFunction<
  typeof executeSafely
>;
const mockedUserService = UserService as jest.Mocked<typeof UserService>;

describe("auth.controller", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("signUp", () => {
    it("passes createUser to executeSafely with expected options", async () => {
      const req = {
        body: { email: "new@example.com", password: "Password123" },
      } as Partial<Request> as Request;
      const res = {} as Partial<Response> as Response;
      const next = jest.fn() as NextFunction;
      mockedUserService.createUser.mockResolvedValueOnce(true);

      await signUp(req, res, next);

      expect(mockedExecuteSafely).toHaveBeenCalledTimes(1);
      const [fn, resArg, nextArg, opts] = mockedExecuteSafely.mock.calls[0];

      expect(resArg).toBe(res);
      expect(nextArg).toBe(next);
      expect(opts).toEqual({
        successStatus: HttpStatusCode.CREATED,
        onEmpty: {
          status: HttpStatusCode.SERVER_ERROR,
          message: "User not created",
        },
      });

      await fn();
      expect(mockedUserService.createUser).toHaveBeenCalledWith(
        req.body as UserInput
      );
    });
  });

  describe("getUserById", () => {
    it("delegates to UserService.getSingleUserById via executeSafely", async () => {
      const req = { params: { userId: 5 } } as unknown as Request<UserParams>;
      const res = {} as Partial<Response> as Response;
      const next = jest.fn() as NextFunction;
      mockedUserService.getSingleUserById.mockResolvedValueOnce({
        userId: 5,
        email: "a@b.com",
        password: "hash",
      } as User);

      await getUserById(req, res, next);

      expect(mockedExecuteSafely).toHaveBeenCalledTimes(1);
      const [fn, resArg, nextArg] = mockedExecuteSafely.mock.calls[0];
      expect(resArg).toBe(res);
      expect(nextArg).toBe(next);

      await fn();
      expect(mockedUserService.getSingleUserById).toHaveBeenCalledWith(5);
    });
  });

  describe("signIn", () => {
    it("sets refresh cookie and returns access token", async () => {
      const req = {
        body: { email: "john@example.com", password: "Password123" },
      } as Partial<Request> as Request;
      const res = { cookie: jest.fn() } as Partial<Response> as Response;
      const next = jest.fn() as NextFunction;
      const tokenPair: TokenPair = {
        accessToken: "access",
        refreshToken: "refresh",
      };
      mockedUserService.signIn.mockResolvedValueOnce(tokenPair);

      await signIn(req, res, next);

      expect(mockedExecuteSafely).toHaveBeenCalledTimes(1);
      const [fn, resArg, nextArg, opts] = mockedExecuteSafely.mock.calls[0];
      expect(resArg).toBe(res);
      expect(nextArg).toBe(next);
      expect(opts).toEqual({
        successStatus: HttpStatusCode.SUCCESS,
        onEmpty: {
          status: HttpStatusCode.UNAUTHORIZED,
          message: "Unauthorized",
        },
      });

      const result = await fn();

      expect(mockedUserService.signIn).toHaveBeenCalledWith(
        req.body as UserInput
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        tokenPair.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
      );
      expect(result).toBe(tokenPair.accessToken);
    });
  });

  describe("refreshToken", () => {
    it("returns access token from service", async () => {
      const req = {
        cookies: { refreshToken: "old" },
      } as Partial<Request> as Request;
      const res = {} as Partial<Response> as Response;
      const next = jest.fn() as NextFunction;
      const tokenPair: TokenPair = {
        accessToken: "newAccess",
        refreshToken: "newRefresh",
      };
      mockedUserService.refreshAccessToken.mockResolvedValueOnce(tokenPair);

      await refreshToken(req, res, next);

      expect(mockedExecuteSafely).toHaveBeenCalledTimes(1);
      const [fn, resArg, nextArg, opts] = mockedExecuteSafely.mock.calls[0];
      expect(resArg).toBe(res);
      expect(nextArg).toBe(next);
      expect(opts).toEqual({ successStatus: HttpStatusCode.SUCCESS });

      const result = await fn();
      expect(mockedUserService.refreshAccessToken).toHaveBeenCalledWith(req);
      expect(result).toBe(tokenPair.accessToken);
    });
  });

  describe("logout", () => {
    it("passes logout call through executeSafely", async () => {
      const req = {
        cookies: { refreshToken: "oldToken" },
      } as Partial<Request> as Request;
      const res = { clearCookie: jest.fn() } as Partial<Response> as Response;
      const next = jest.fn() as NextFunction;

      mockedUserService.logout.mockResolvedValueOnce(true);

      await logout(req, res, next);

      expect(mockedExecuteSafely).toHaveBeenCalledTimes(1);
      const [fn, resArg, nextArg] = mockedExecuteSafely.mock.calls[0];
      expect(resArg).toBe(res);
      expect(nextArg).toBe(next);

      const result = await fn();
      expect(mockedUserService.logout).toHaveBeenCalledWith(req, res);
      expect(result).toBe(true);
    });
  });
});
