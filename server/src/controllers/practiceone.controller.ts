import { RequestHandler } from "express";
import { PracticeOneDTO } from "../repositories/practiceone.repository";
import { PracticeService } from "../services/practiceone.service";

interface GetPracticesParams {
  practiceId: string;
}

export const getPractices: RequestHandler<
  GetPracticesParams,
  PracticeOneDTO[]
> = async (req, res) => {
  const practiceId = Number(req.params.practiceId);
  const practiceList = await PracticeService.getPractices(practiceId);
  res.json(practiceList);
};
