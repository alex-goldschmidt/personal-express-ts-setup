import { RequestHandler } from "express";
import { UserRequestDTO } from "../dtos/auth.dto";
import { UserService } from "../services/auth.service";
import executeSafely from "../utils/executeSafely";

/**
 * POST /api/users/register
 *
 * Params: {}
 *
 * Response: PracticeOneRequestDTO
 */
export const signUp: RequestHandler<{}, number, UserRequestDTO> = async (
  req,
  res,
  next
) => {
  const newUser: UserRequestDTO = {
    email: req.body.email,
    password: req.body.email,
  };
  return executeSafely(() => UserService.createUser(newUser), res, next, {
    successStatus: 201,
    onEmpty: { status: 500, message: "User not created" },
  });
};
