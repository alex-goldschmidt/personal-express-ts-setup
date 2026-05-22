import { createOpenApiDocument } from "../../src/openapi/document";

describe("OpenAPI document", () => {
  it("generates existing auth routes and public user schema", () => {
    const document = createOpenApiDocument();

    expect(document.paths["/api/users/register"]?.post).toBeDefined();
    expect(document.paths["/api/users/signIn"]?.post).toBeDefined();
    expect(document.paths["/api/users/refreshToken"]?.post).toBeDefined();
    expect(document.paths["/api/users/logout"]?.post).toBeDefined();
    expect(document.paths["/api/users/{userId}"]?.get).toBeDefined();

    const userSchema = document.components?.schemas?.User;

    expect(userSchema).toEqual(
      expect.objectContaining({
        type: "object",
        properties: expect.objectContaining({
          userId: expect.any(Object),
          email: expect.any(Object),
        }),
      })
    );
    expect(JSON.stringify(userSchema)).not.toContain("password");
  });
});
