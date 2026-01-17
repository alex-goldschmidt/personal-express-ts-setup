import { UserRepository } from "../repositories/auth.repository";
import { User } from "../dtos/auth.dto";
import { validateWithZod } from "../utils/errorValidator";
import { ConflictError } from "../config/exceptions";
import { hashPassword } from "../utils/password";
import { UserInput, UserInputSchema } from "../models/userCreateInput.model";
export class UserService {
  static async getSingleUserById(userId: number): Promise<User | null> {
    const result = await UserRepository.queryByUserId(userId);
    return result;
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
