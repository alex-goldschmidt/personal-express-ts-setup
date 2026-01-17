import { Router } from "express";
import { getUserById, signUp } from "../controllers/auth.controller";
let authRouter: Router = Router();

authRouter.post("/register", signUp);
authRouter.get("/:userId", getUserById);

export default authRouter;
