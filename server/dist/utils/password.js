"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
const argon2_1 = require("@node-rs/argon2");
async function hashPassword(password) {
    try {
        //options config: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
        const options = {
            algorithm: 2 /* Algorithm.Argon2id */,
            memoryCost: 19 * 1024,
            timeCost: 2,
            parallelism: 1,
        };
        const hashedPassword = await (0, argon2_1.hash)(password, options);
        return hashedPassword;
    }
    catch (err) {
        console.error("Hashing failed:", err);
        throw err;
    }
}
