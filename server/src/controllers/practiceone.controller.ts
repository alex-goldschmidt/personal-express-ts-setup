import { RequestHandler } from "express";
import { PracticeOneDTO, PracticeOneRequestDTO } from "../dtos/practiceone.dto";
import { PracticeService } from "../services/practiceone.service";
import executeSafely from "../utils/executeSafely";

export interface GetPracticesParams {
  practiceId: number;
}

export const getPractices: RequestHandler<{}, PracticeOneDTO[]> = async (
  _req,
  res,
  next
) => {
  return executeSafely(() => PracticeService.getPractices(), res, next);
};

export const getPracticeByPracticeId: RequestHandler<
  GetPracticesParams,
  PracticeOneDTO | null
> = async (req, res, next) => {
  return executeSafely(
    () => PracticeService.getSinglePractice(req.params.practiceId),
    res,
    next
  );
};

export const createPractice: RequestHandler<
  {},
  number,
  PracticeOneRequestDTO
> = async (req, res, next) => {
  const practiceDto: PracticeOneRequestDTO = {
    name: req.body.name,
    description: req.body.description,
  };
  return executeSafely(
    () => PracticeService.createPractice(practiceDto),
    res,
    next,
    {
      successStatus: 201,
      onEmpty: { status: 500, message: "Practice Record not created" },
    }
  );
};

export const updatePractice: RequestHandler<
  GetPracticesParams,
  number,
  PracticeOneRequestDTO
> = async (req, res, next) => {
  const practiceId = Number(req.params.practiceId);
  const updatedPracticeRecord: PracticeOneRequestDTO = {
    practiceId: practiceId,
    name: req.body.name,
    description: req.body.description,
  };
  return executeSafely(
    () => PracticeService.updatePractice(updatedPracticeRecord),
    res,
    next,
    {
      successStatus: 200,
      onEmpty: { status: 404, message: "Practice Record not updated" },
    }
  );
};

export const deletePractice: RequestHandler<
  GetPracticesParams,
  number
> = async (req, res, next) => {
  const practiceId = Number(req.params.practiceId);
  return executeSafely(
    () => PracticeService.deletePractice(practiceId),
    res,
    next,
    {
      successStatus: 200,
      onEmpty: { status: 404, message: "Practice Record not deleted" },
    }
  );
};
