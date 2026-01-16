import { Router } from "express";
import { signUp } from "../controllers/auth.controller";
let authRouter: Router = Router();

authRouter.post("/register", signUp);

export default authRouter;
