import { Request, Response } from "express";
import { getPractices } from "../src/controllers/practiceone.controller";
import { PracticeService } from "../src/services/practiceone.service";

jest.mock("../src/services/practiceone.service");
jest.mock("../src/config/db", () => ({
  pool: {
    execute: jest.fn(),
  },
}));

describe("PracticeOne Controller", () => {
  it("should return an array when items exist", async () => {
    const mockPractices = [
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
});
