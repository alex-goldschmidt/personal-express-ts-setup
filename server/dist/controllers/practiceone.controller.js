"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPractices = void 0;
const practiceone_service_1 = require("../services/practiceone.service");
const getPractices = async (req, res) => {
    const practiceId = Number(req.params.practiceId);
    const practiceList = await practiceone_service_1.PracticeService.getPractices(practiceId);
    res.json(practiceList);
};
exports.getPractices = getPractices;
