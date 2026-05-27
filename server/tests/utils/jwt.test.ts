import jwt from "jsonwebtoken";
import { generateTokenPair } from "../../src/utils/jwt";

describe("jwt utils", () => {
  it("generates unique refresh tokens for back-to-back issuances", async () => {
    const first = await generateTokenPair(42);
    const second = await generateTokenPair(42);

    expect(first.refreshToken).not.toEqual(second.refreshToken);

    const firstPayload = jwt.decode(first.refreshToken);
    const secondPayload = jwt.decode(second.refreshToken);

    expect(firstPayload).toMatchObject({ sub: "42" });
    expect(secondPayload).toMatchObject({ sub: "42" });
    expect(firstPayload).toHaveProperty("jti");
    expect(secondPayload).toHaveProperty("jti");
    expect((firstPayload as jwt.JwtPayload).jti).not.toEqual(
      (secondPayload as jwt.JwtPayload).jti
    );
  });
});
