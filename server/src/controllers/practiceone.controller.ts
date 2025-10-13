import { RequestHandler } from "express";
import { PracticeOneDTO, PracticeOneRequestDTO } from "../dtos/practiceone.dto";
import { PracticeService } from "../services/practiceone.service";

interface GetPracticesParams {
  practiceId: string;
}

export const getPractices: RequestHandler<{}, PracticeOneDTO[]> = async (
  _req,
  res,
  next
) => {
  const practiceList = await PracticeService.getPractices();
  if (!practiceList) {
    const err = new Error("Practice Records don't exist");
    res.status(404);
    return next(err);
  }
  res.json(practiceList);
};

export const getPracticeByPracticeId: RequestHandler<
  GetPracticesParams,
  PracticeOneDTO | null
> = async (req, res, next) => {
  const practiceId = Number(req.params.practiceId);
  const practiceItem = await PracticeService.getSinglePractice(practiceId);
  if (!practiceItem) {
    const err = new Error("Practice Record doesn't exist");
    res.status(404);
    return next(err);
  }
  res.json(practiceItem);
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

  const insertId = await PracticeService.createPractice(practiceDto);
  if (!insertId || insertId === 0) {
    const err = new Error("Practice Record not created");
    res.status(404);
    return next(err);
  }
  res.status(201).json(insertId);
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

  const updatedId = await PracticeService.updatePractice(updatedPracticeRecord);
  if (!updatedId || updatedId === 0) {
    const err = new Error("Practice Record not created");
    res.status(404);
    return next(err);
  }
  res.status(200).json(updatedId);
};

export const deletePractice: RequestHandler<
  GetPracticesParams,
  number
> = async (req, res, next) => {
  const practiceId = Number(req.params.practiceId);

  const deletedId = await PracticeService.deletePractice(practiceId);
  if (!deletedId || deletedId === 0) {
    const err = new Error("Practice Record not created");
    res.status(404);
    return next(err);
  }
  res.status(200).json(deletedId);
};
