"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryListAsync = queryListAsync;
exports.queryFirstAsync = queryFirstAsync;
exports.insertAsync = insertAsync;
exports.executeNonQueryAsync = executeNonQueryAsync;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validate required environment variables
const requiredEnvVars = [
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
const pool = promise_1.default.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    dateStrings: true,
});
async function testConnection() {
    let retries = 5;
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log("Successfully connected to the database.");
            connection.release();
            break;
        }
        catch (error) {
            retries -= 1;
            console.error(`Database connection failed. Retries left: ${retries}. Error:`, error);
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
    }
    catch (error) {
        console.error("Error closing the database connection pool:", error);
    }
    process.exit(0);
});
(async () => {
    await testConnection();
})();
async function queryListAsync(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}
async function queryFirstAsync(sql, params = []) {
    let query = `${sql} LIMIT 1`;
    const [rows] = await pool.execute(query, params);
    return rows[0] ?? null;
}
async function insertAsync(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return (result.insertId ?? 0);
}
async function executeNonQueryAsync(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
}
exports.default = pool;
