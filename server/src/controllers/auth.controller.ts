import { UserService } from "../services/auth.service";
import executeSafely from "../utils/executeSafely";
import { UserInput } from "../models/userCreateInput.model";
import { User } from "../dtos/auth.dto";
import { HttpStatusCode } from "../constants/constants";
import { RequestHandler } from "express";
import { TokenPair } from "../utils/jwt";

export interface UserParams {
  userId: number;
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
    () => UserService.getSingleUserById(req.params.userId),
    res,
    next
  );
};

/**
 * POST /api/users/signIn
 *
 * Params: {}
 *
 * Response: boolean
 */
export const signIn: RequestHandler<{}, TokenPair, UserInput> = async (
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

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

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
 * Response: Promise<string>
 */

export const refreshToken: RequestHandler<{}, string> = async (
  req,
  res,
  next
) => {
  return executeSafely(
    async () => {
      const newAccessToken = await UserService.refreshAccessToken(req);
      return newAccessToken;
    },
    res,
    next,
    {
      successStatus: HttpStatusCode.SUCCESS,
    }
  );
};
