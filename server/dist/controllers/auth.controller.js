"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.signUp = void 0;
const auth_service_1 = require("../services/auth.service");
const executeSafely_1 = __importDefault(require("../utils/executeSafely"));
/**
 * POST /api/users/register
 *
 * Params: {}
 *
 * Response: PracticeOneRequestDTO
 */
const signUp = async (req, res, next) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
    };
    return (0, executeSafely_1.default)(() => auth_service_1.UserService.createUser(newUser), res, next, {
        successStatus: 201,
        onEmpty: { status: 500, message: "User not created" },
    });
};
exports.signUp = signUp;
/**
 * GET /api/users/:userId
 *
 * Params: { userId : number }
 *
 * Response: User
 */
const getUserById = async (req, res, next) => {
    return (0, executeSafely_1.default)(() => auth_service_1.UserService.getSingleUserById(req.params.userId), res, next);
};
exports.getUserById = getUserById;
