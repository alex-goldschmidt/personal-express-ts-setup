import { Router } from "express";
import {
  getPractices,
  getPracticeByPracticeId,
  createPractice,
  updatePractice,
  deletePractice,
} from "../controllers/practiceone.controller";
let practiceOneRouter: Router = Router();

practiceOneRouter.get("/", getPractices);
practiceOneRouter.get("/:practiceId", getPracticeByPracticeId);
practiceOneRouter.post("/", createPractice);
practiceOneRouter.put("/:practiceId", updatePractice);
practiceOneRouter.delete("/:practiceId", deletePractice);

export default practiceOneRouter;
