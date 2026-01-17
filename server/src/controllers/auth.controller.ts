import { RequestHandler } from "express";
import { UserService } from "../services/auth.service";
import executeSafely from "../utils/executeSafely";
import { UserInput } from "../models/userCreateInput.model";
import { User } from "../dtos/auth.dto";
import { HttpStatusCode } from "../constants/constants";

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
