import { UserRepository } from "../repositories/auth.repository";
import { User, UserRequestDTO } from "../dtos/auth.dto";
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

  static async createUser(user: UserRequestDTO): Promise<number> {
    return await UserRepository.createUser(user);
  }

  static async deleteUser(userId: number): Promise<number> {
    return await UserRepository.deleteUser(userId);
  }
}
