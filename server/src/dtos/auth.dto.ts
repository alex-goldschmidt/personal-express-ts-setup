import { RowDataPacket } from "mysql2";
export interface User extends RowDataPacket {
  email: string;
  password: string;
}

export interface UserRequestDTO {
  email: string;
  password: string;
}
