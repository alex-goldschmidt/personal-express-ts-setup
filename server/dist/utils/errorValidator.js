"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWithZod = validateWithZod;
const exceptions_1 = require("../config/exceptions");
function validateWithZod(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
    }));
    throw new exceptions_1.ValidationError(errors);
}
