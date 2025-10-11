"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPractices = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const practiceone_model_1 = require("../models/practiceone.model");
exports.getPractices = (0, express_async_handler_1.default)(async (req, res, next) => {
    const practiceId = Number(req.params.practiceId);
    const practices = await practiceone_model_1.PracticeOne.queryListByPracticeId(practiceId);
    if (practices === null) {
        const err = new Error("practices not found");
        res.status(404);
        return next(err);
    }
    res.json(practices);
    /;
});
