import { RequestHandler } from "express";
import { UserService } from "../services/auth.service";
import executeSafely from "../utils/executeSafely";
import { UserCreateInput } from "../models/userCreateInput.model";
import { User } from "../dtos/auth.dto";

export interface UserParams {
  userId: number;
}

/**
 * POST /api/users/register
 *
 * Params: {}
 *
 * Response: PracticeOneRequestDTO
 */
export const signUp: RequestHandler<{}, number, UserCreateInput> = async (
  req,
  res,
  next
) => {
  const newUser: UserCreateInput = {
    email: req.body.email,
    password: req.body.password,
  };
  return executeSafely(() => UserService.createUser(newUser), res, next, {
    successStatus: 201,
    onEmpty: { status: 500, message: "User not created" },
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
