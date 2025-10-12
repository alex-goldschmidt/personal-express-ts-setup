import { RowDataPacket } from "mysql2";
export interface PracticeOneDTO extends RowDataPacket {
  practiceId: number;
  name: string;
  description: string;
}

export interface PracticeOneRequestDTO {
  practiceId?: number;
  name: string;
  description: string;
}
