import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../config/exceptions";

/**
 * Authorization middleware that verifies the authenticated user
 * has permission to access the requested resource.
 *
 * This middleware should be used AFTER authenticateToken middleware.
 * It checks if the authenticated user matches the userId in the route params.
 */
export function authorizeUserId(
  req: Request<{ userId: string }>,
  _res: Response,
  next: NextFunction
): void {
  const sub = (req.user as JwtPayload)?.sub;
  if (!sub) {
    throw new UnauthorizedError("Missing user identity");
  }
  const authenticatedUserId = parseInt(sub, 10);
  const requestedUserId = parseInt(req.params.userId);

  if (
    !Number.isInteger(authenticatedUserId) ||
    !Number.isInteger(requestedUserId)
  ) {
    throw new UnauthorizedError("Invalid user identifier");
  }

  if (authenticatedUserId !== requestedUserId) {
    throw new ForbiddenError("You are not authorized to access this user");
  }

  next();
}
