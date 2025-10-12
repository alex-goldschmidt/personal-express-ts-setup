import { Router } from "express";
import { getPractices } from "../controllers/practiceone.controller";
let practiceOneRouter: Router = Router();

practiceOneRouter.get("/", getPractices);

export default practiceOneRouter;
