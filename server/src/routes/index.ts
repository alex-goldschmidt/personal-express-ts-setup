import { Router } from "express";
import practiceOneRouter from "./practiceone.route";
import authRouter from "./auth.route";

let apiRouter: Router = Router();

apiRouter.use("/practices", practiceOneRouter);
apiRouter.use("/users", authRouter);

export default apiRouter;
