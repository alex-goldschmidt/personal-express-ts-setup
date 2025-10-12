import { Router } from "express";
import practiceOneRouter from "./practiceone.route";

let apiRouter: Router = Router();

apiRouter.use("/practices", practiceOneRouter);

export default apiRouter;
