import { Router } from "express";
import {
  getUserById,
  logout,
  refreshToken,
  signIn,
  signUp,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/authenticateToken.middleware";
let authRouter: Router = Router();

authRouter.post("/register", signUp);
authRouter.get("/:userId", authenticateToken, getUserById);
authRouter.post("/signIn", signIn);
authRouter.post("/refreshToken", refreshToken);
authRouter.post("/logout", logout);

export default authRouter;
