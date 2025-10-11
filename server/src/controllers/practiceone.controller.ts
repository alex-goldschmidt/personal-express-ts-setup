import { Request, Response, RequestHandler, NextFunction } from "express";
import expressAsyncHandler from "express-async-handler";
import { PracticeOne, PracticeOneDTO } from "../models/practiceone.model";

export const getPractices: RequestHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const practiceId = Number(req.params.practiceId);
    const practices = await PracticeOne.queryListByPracticeId(practiceId);

    if (practices === null) {
      const err = new Error("practices not found");
      res.status(404);
      return next(err);
    }

    res.json(practices);
  }
);
