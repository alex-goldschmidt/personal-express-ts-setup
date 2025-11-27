import { PracticeService } from "../../src/services/practiceone.service";
import { PracticeOneRepository } from "../../src/repositories/practiceone.repository";
import {
  PracticeOneDTO,
  PracticeOneRequestDTO,
} from "../../src/dtos/practiceone.dto";

jest.mock("../../src/repositories/practiceone.repository");

const mockedRepo = PracticeOneRepository as jest.Mocked<
  typeof PracticeOneRepository
>;

describe("PracticeService", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("getPractices returns an array when repository returns data", async () => {
    const fake: PracticeOneDTO[] = [
      { practiceId: 1, name: "A", description: "Desc" } as PracticeOneDTO,
    ];
    mockedRepo.queryAllPractices.mockResolvedValueOnce(fake as any);

    const res = await PracticeService.getPractices();
    expect(res).toEqual(fake);
    expect(mockedRepo.queryAllPractices).toHaveBeenCalled();
  });

  it("getSinglePractice returns a DTO when found", async () => {
    const fake: PracticeOneDTO = {
      practiceId: 2,
      name: "B",
      description: "Desc2",
    } as PracticeOneDTO;
    mockedRepo.queryByPracticeId.mockResolvedValueOnce(fake as any);

    const res = await PracticeService.getSinglePractice(2);
    expect(res).toEqual(fake);
    expect(mockedRepo.queryByPracticeId).toHaveBeenCalledWith(2);
  });

  it("createPractice forwards to repository and returns id", async () => {
    const request: PracticeOneRequestDTO = {
      name: "C",
      description: "D",
    } as PracticeOneRequestDTO;
    mockedRepo.createPractice.mockResolvedValueOnce(42 as any);

    const res = await PracticeService.createPractice(request);
    expect(res).toBe(42);
    expect(mockedRepo.createPractice).toHaveBeenCalledWith(request);
  });
});
