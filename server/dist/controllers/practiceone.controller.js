"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePractice = exports.updatePractice = exports.createPractice = exports.getPracticeByPracticeId = exports.getPractices = void 0;
const practiceone_service_1 = require("../services/practiceone.service");
const executeSafely_1 = __importDefault(require("../utils/executeSafely"));
/**
 * GET /api/practices/
 *
 * Params: {}
 *
 * Response: PracticeOneDTO
 */
const getPractices = async (_req, res, next) => {
    return (0, executeSafely_1.default)(() => practiceone_service_1.PracticeService.getPractices(), res, next);
};
exports.getPractices = getPractices;
/**
 * GET /api/practices/:practiceId
 *
 * Params: { practiceId: number }
 *
 * Response: PracticeOneDTO
 */
const getPracticeByPracticeId = async (req, res, next) => {
    return (0, executeSafely_1.default)(() => practiceone_service_1.PracticeService.getSinglePractice(req.params.practiceId), res, next);
};
exports.getPracticeByPracticeId = getPracticeByPracticeId;
/**
 * POST /api/practices/
 *
 * Params: {}
 *
 * Response: PracticeOneRequestDTO
 */
const createPractice = async (req, res, next) => {
    const practiceDto = {
        name: req.body.name,
        description: req.body.description,
    };
    return (0, executeSafely_1.default)(() => practiceone_service_1.PracticeService.createPractice(practiceDto), res, next, {
        successStatus: 201,
        onEmpty: { status: 500, message: "Practice Record not created" },
    });
};
exports.createPractice = createPractice;
/**
 * PUT /api/practices/
 *
 * Params: GetPracticesParams
 *
 * Response: number
 *
 * Request: PracticeOneRequestDTO
 */
const updatePractice = async (req, res, next) => {
    const practiceId = Number(req.params.practiceId);
    const updatedPracticeRecord = {
        practiceId: practiceId,
        name: req.body.name,
        description: req.body.description,
    };
    return (0, executeSafely_1.default)(() => practiceone_service_1.PracticeService.updatePractice(updatedPracticeRecord), res, next, {
        successStatus: 200,
        onEmpty: { status: 404, message: "Practice Record not updated" },
    });
};
exports.updatePractice = updatePractice;
/**
 * DELETE /api/practices/
 *
 * Params: GetPracticesParams
 *
 * Response: number
 */
const deletePractice = async (req, res, next) => {
    const practiceId = Number(req.params.practiceId);
    return (0, executeSafely_1.default)(() => practiceone_service_1.PracticeService.deletePractice(practiceId), res, next, {
        successStatus: 200,
        onEmpty: { status: 404, message: "Practice Record not deleted" },
    });
};
exports.deletePractice = deletePractice;
