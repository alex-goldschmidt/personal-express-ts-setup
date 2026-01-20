import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | undefined;
      cookies?: {
        refreshToken?: string;
      };
    }
  }
}

export { ExpressRequest };
