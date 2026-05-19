import { UserService } from "../services/auth.service";
import executeSafely from "../utils/executeSafely";
import { UserInput } from "../models/userCreateInput.model";
import { User } from "../dtos/auth.dto";
import { HttpStatusCode } from "../constants/constants";
import { RequestHandler } from "express";
import { setRefreshTokenCookie } from "../utils/jwt";

export interface UserParams {
  userId: string;
}

/**
 * POST /api/users/register
 *
 * Params: {}
 *
 * Response: boolean
 */
export const signUp: RequestHandler<{}, boolean, UserInput> = async (
  req,
  res,
  next
) => {
  const userInput: UserInput = {
    email: req.body.email,
    password: req.body.password,
  };
  return executeSafely(() => UserService.createUser(userInput), res, next, {
    successStatus: HttpStatusCode.CREATED,
    onEmpty: {
      status: HttpStatusCode.SERVER_ERROR,
      message: "User not created",
    },
  });
};

/**
 * GET /api/users/:userId
 *
 * Params: { userId : number }
 *
 * Response: User
 */
export const getUserById: RequestHandler<UserParams, User> = async (
  req,
  res,
  next
) => {
  return executeSafely(
    async () =>
      await UserService.getSingleUserById(parseInt(req.params.userId)),
    res,
    next
  );
};

/**
 * POST /api/users/signIn
 *
 * Params: {}
 *
 * Response: string
 */
export const signIn: RequestHandler<{}, string, UserInput> = async (
  req,
  res,
  next
) => {
  const userInput: UserInput = {
    email: req.body.email,
    password: req.body.password,
  };
  return executeSafely(
    async () => {
      const tokens = await UserService.signIn(userInput);

      await setRefreshTokenCookie(
        res,
        tokens.refreshToken,
        tokens.refreshTokenExpiration
      );

      return tokens.accessToken;
    },
    res,
    next,
    {
      successStatus: HttpStatusCode.SUCCESS,
      onEmpty: {
        status: HttpStatusCode.UNAUTHORIZED,
        message: "Unauthorized",
      },
    }
  );
};
/**
 * POST /api/users/refreshToken
 *
 * Params: {}
 *
 * Response: string
 */

export const refreshToken: RequestHandler<{}, string> = async (
  req,
  res,
  next
) => {
  return executeSafely(
    async () => {
      const tokenPair = await UserService.refreshAccessToken(req);
      await setRefreshTokenCookie(
        res,
        tokenPair.refreshToken,
        tokenPair.refreshTokenExpiration
      );
      return tokenPair.accessToken;
    },
    res,
    next,
    {
      successStatus: HttpStatusCode.SUCCESS,
    }
  );
};

/**
 * POST /api/users/logout
 *
 * Params: {}
 *
 * Response: boolean
 */

export const logout: RequestHandler<{}, boolean> = async (req, res, next) => {
  return executeSafely(async () => UserService.logout(req, res), res, next);
};
