import { Request, Response } from "express";
import {
  getPractices,
  getPracticeByPracticeId,
} from "../src/controllers/practiceone.controller";
import { PracticeService } from "../src/services/practiceone.service";
import { PracticeOneRequestDTO } from "../src/dtos/practiceone.dto";
import { GetPracticesParams } from "../src/controllers/practiceone.controller";

jest.mock("../src/services/practiceone.service");
jest.mock("../src/config/db", () => ({
  pool: {
    execute: jest.fn(),
  },
}));

describe("PracticeOne Controller", () => {
  it("should return an array PracticeOne items when items exist", async () => {
    const mockPractices: PracticeOneRequestDTO[] = [
      { practiceId: 1, name: "Practice A", description: "Desc A" },
      { practiceId: 2, name: "Practice B", description: "Desc B" },
    ];

    (PracticeService.getPractices as jest.Mock).mockResolvedValue(
      mockPractices
    );

    const req = {} as Request;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    await getPractices(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockPractices);
    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return an single PracticeOne items when it exists", async () => {
    const mockPractice: PracticeOneRequestDTO = {
      practiceId: 1,
      name: "Practice A",
      description: "Desc A",
    };
    (PracticeService.getSinglePractice as jest.Mock).mockResolvedValue(
      mockPractice
    );

    const req = {
      params: { practiceId: "1" },
    } as unknown as Request<GetPracticesParams>;
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn();

    await getPracticeByPracticeId(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockPractice);
    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });
});
