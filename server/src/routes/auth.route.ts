import { Router } from "express";
import { getUserById, signIn, signUp } from "../controllers/auth.controller";
let authRouter: Router = Router();

authRouter.post("/register", signUp);
authRouter.get("/:userId", getUserById);
authRouter.post("/signIn", signIn);

export default authRouter;
