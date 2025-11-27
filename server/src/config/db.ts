import mysql2, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables
const requiredEnvVars: string[] = [
  "MYSQLHOST",
  "MYSQLUSER",
  "MYSQLPASSWORD",
  "MYSQLDATABASE",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const pool: mysql2.Pool = mysql2.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  dateStrings: true,
});

async function testConnection(): Promise<void> {
  let retries = 5;
  while (retries > 0) {
    try {
      const connection = await pool.getConnection();
      console.log("Successfully connected to the database.");
      connection.release();
      break;
    } catch (error) {
      retries -= 1;
      console.error(
        `Database connection failed. Retries left: ${retries}. Error:`,
        error
      );
      if (retries === 0) {
        console.error("All retries failed. Exiting...");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try {
    await pool.end();
    console.log("Database connection pool closed.");
  } catch (error) {
    console.error("Error closing the database connection pool:", error);
  }
  process.exit(0);
});

(async () => {
  await testConnection();
})();

export async function queryListAsync<T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows ?? [];
}

export async function queryFirstAsync<T extends RowDataPacket>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  let query = `${sql} LIMIT 1`;
  const [rows] = await pool.execute<T[]>(query, params);
  return rows[0] ?? null;
}

export async function insertAsync(
  sql: string,
  params: any[] = []
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return (result.insertId ?? 0) as number;
}

export async function executeNonQueryAsync(
  sql: string,
  params: any[] = []
): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result.affectedRows;
}

export default pool;
