import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../config/exceptions";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

export function authenticateToken<P = Record<string, string>>(
  req: Request<P>,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing token"));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET as Secret
    ) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ForbiddenError("Token expired"));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new ForbiddenError("Invalid token"));
    }
    return next(new ForbiddenError("Authentication failed"));
  }
}
