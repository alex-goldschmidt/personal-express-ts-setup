import { UserDTO } from "../../src/dtos/user.dto";
import { toUserModel } from "../../src/mappers/user.mapper";

describe("user.mapper", () => {
  it("maps UserDTO to public User without internal fields", () => {
    const dto = {
      userId: 1,
      email: "test@example.com",
      password: "hashed-password",
      inserted: "2026-05-21 12:00:00",
      updated: "2026-05-21 12:00:00",
    } as UserDTO;

    expect(toUserModel(dto)).toEqual({
      userId: 1,
      email: "test@example.com",
    });
  });
});
