import { UserRepository } from "../repositories/auth.repository";
import { User } from "../dtos/auth.dto";
import { validateWithZod } from "../utils/errorValidator";
import { ConflictError, UnauthorizedError } from "../config/exceptions";
import { hashPassword } from "../utils/password";
import { UserInput, UserInputSchema } from "../models/userCreateInput.model";
import { verify } from "@node-rs/argon2";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export class UserService {
  static async getSingleUserById(userId: number): Promise<User | null> {
    const result = await UserRepository.queryByUserId(userId);
    return result;
  }

  static async signIn(userInput: UserInput): Promise<string> {
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

    const jwtPayload: JwtPayload = {
      sub: existingUser.userId?.toString(),
    };
    const signedToken = jwt.sign(
      jwtPayload,
      process.env.JWT_ACCESS_TOKEN_SECRET as Secret,
      {
        expiresIn: "15m",
        algorithm: "HS256",
      }
    );

    return signedToken;
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
