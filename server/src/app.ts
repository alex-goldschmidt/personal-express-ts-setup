import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { Request, Response } from "express";
import process from "process";
import dotenv from "dotenv";
import apiRouter from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { HttpStatusCode } from "./constants/constants";
import { ExpressRequest } from "./types/express";
/* ^ignore intellisense, don't remove this or you'll get MODULE_NOT_FOUND
    when starting up the app */

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
dotenv.config();

app.use("/api", apiRouter);

app.use((req: Request, res: Response) => {
  res.status(HttpStatusCode.NOT_FOUND).json({
    statusCode: HttpStatusCode.NOT_FOUND,
    message: `${req.method} ${req.originalUrl} Not Found`,
  });
});

app.use(errorHandler);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
