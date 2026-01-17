import { UserRepository } from "../repositories/auth.repository";
import { User } from "../dtos/auth.dto";
import {
  UserCreateInput,
  UserCreateInputSchema,
} from "../models/userCreateInput.model";
import { validateWithZod } from "../utils/errorValidator";
import { ConflictError } from "../config/exceptions";
export class UserService {
  static async getUsers(): Promise<User[]> {
    const result = await UserRepository.queryAllUsers();
    return result;
  }

  static async getSingleUserById(userId: number): Promise<User | null> {
    const result = await UserRepository.queryByUserId(userId);
    return result;
  }

  static async getSingleUserByEmail(email: string): Promise<User | null> {
    const result = await UserRepository.queryByEmail(email);
    return result;
  }

  static async createUser(newUser: UserCreateInput): Promise<number> {
    const validatedUser = validateWithZod(UserCreateInputSchema, newUser);
    const isExistingUser = await UserRepository.queryByEmail(
      validatedUser.email
    );

    if (isExistingUser) {
      throw new ConflictError("User with this email already exists.");
    }

    return await UserRepository.createUser(newUser);
  }

  static async deleteUser(userId: number): Promise<number> {
    return await UserRepository.deleteUser(userId);
  }
}
