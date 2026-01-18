import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../config/exceptions";
import dotenv from "dotenv";
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | undefined;
    }
  }
}

export function authenticateToken<P = Record<string, string>>(
  req: Request<P>,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new UnauthorizedError("Missing token");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as Secret
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ForbiddenError("Token expired");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new ForbiddenError("Invalid token");
    }
    throw new ForbiddenError("Authentication failed");
  }
}
