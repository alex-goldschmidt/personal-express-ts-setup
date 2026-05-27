import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { authenticateToken } from "../../src/middlewares/authenticateToken.middleware";
import { ForbiddenError, UnauthorizedError } from "../../src/config/exceptions";

describe("authenticateToken", () => {
  const res = {} as Response;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("passes missing authorization headers to next as UnauthorizedError", () => {
    const req = { headers: {} } as Request;
    const next = jest.fn() as NextFunction;
    const verifySpy = jest.spyOn(jwt, "verify");

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("rejects malformed bearer headers without verifying", () => {
    const req = {
      headers: { authorization: "Basic token" },
    } as Request;
    const next = jest.fn() as NextFunction;
    const verifySpy = jest.spyOn(jwt, "verify");

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it("sets req.user for valid bearer tokens", () => {
    const req = {
      headers: { authorization: "Bearer accessToken" },
    } as Request;
    const next = jest.fn() as NextFunction;
    const decoded = { sub: "7" } as JwtPayload;
    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => decoded);

    authenticateToken(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledWith();
  });

  it("passes invalid token errors to next as ForbiddenError", () => {
    const req = {
      headers: { authorization: "Bearer badToken" },
    } as Request;
    const next = jest.fn() as NextFunction;
    jest
      .spyOn(jwt, "verify")
      .mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError("invalid");
      });

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
