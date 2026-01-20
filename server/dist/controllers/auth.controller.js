"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.signIn = exports.getUserById = exports.signUp = void 0;
const auth_service_1 = require("../services/auth.service");
const executeSafely_1 = __importDefault(require("../utils/executeSafely"));
/**
 * POST /api/users/register
 *
 * Params: {}
 *
 * Response: boolean
 */
const signUp = async (req, res, next) => {
    const userInput = {
        email: req.body.email,
        password: req.body.password,
    };
    return (0, executeSafely_1.default)(() => auth_service_1.UserService.createUser(userInput), res, next, {
        successStatus: 201 /* HttpStatusCode.CREATED */,
        onEmpty: {
            status: 500 /* HttpStatusCode.SERVER_ERROR */,
            message: "User not created",
        },
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
/**
 * POST /api/users/signIn
 *
 * Params: {}
 *
 * Response: boolean
 */
const signIn = async (req, res, next) => {
    const userInput = {
        email: req.body.email,
        password: req.body.password,
    };
    return (0, executeSafely_1.default)(async () => {
        const tokens = await auth_service_1.UserService.signIn(userInput);
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });
        return tokens.accessToken;
    }, res, next, {
        successStatus: 200 /* HttpStatusCode.SUCCESS */,
        onEmpty: {
            status: 401 /* HttpStatusCode.UNAUTHORIZED */,
            message: "Unauthorized",
        },
    });
};
exports.signIn = signIn;
/**
 * POST /api/users/refreshToken
 *
 * Params: {}
 *
 * Response: Promise<string>
 */
const refreshToken = async (req, res, next) => {
    return (0, executeSafely_1.default)(async () => {
        const newAccessToken = await auth_service_1.UserService.refreshAccessToken(req);
        return newAccessToken;
    }, res, next, {
        successStatus: 200 /* HttpStatusCode.SUCCESS */,
    });
};
exports.refreshToken = refreshToken;
