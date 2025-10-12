"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePractice = exports.updatePractice = exports.createPractice = exports.getPracticeByPracticeId = exports.getPractices = void 0;
const practiceone_service_1 = require("../services/practiceone.service");
const getPractices = async (_req, res, next) => {
    const practiceList = await practiceone_service_1.PracticeService.getPractices();
    if (!practiceList) {
        const err = new Error("Practice Records don't exist");
        res.status(404);
        return next(err);
    }
    res.json(practiceList);
};
exports.getPractices = getPractices;
const getPracticeByPracticeId = async (req, res, next) => {
    const practiceId = Number(req.params.practiceId);
    const practiceItem = await practiceone_service_1.PracticeService.getSinglePractice(practiceId);
    if (!practiceItem) {
        const err = new Error("Practice Record doesn't exist");
        res.status(404);
        return next(err);
    }
    res.json(practiceItem);
};
exports.getPracticeByPracticeId = getPracticeByPracticeId;
const createPractice = async (req, res, next) => {
    const practiceDto = {
        name: req.body.name,
        description: req.body.description,
    };
    const insertId = await practiceone_service_1.PracticeService.createPractice(practiceDto);
    if (!insertId || insertId === 0) {
        const err = new Error("Practice Record not created");
        res.status(404);
        return next(err);
    }
    res.status(201).json(insertId);
};
exports.createPractice = createPractice;
const updatePractice = async (req, res, next) => {
    const practiceId = Number(req.params.practiceId);
    const updatedPracticeRecord = {
        practiceId: practiceId,
        name: req.body.name,
        description: req.body.description,
    };
    const updatedId = await practiceone_service_1.PracticeService.updatePractice(updatedPracticeRecord);
    if (!updatedId || updatedId === 0) {
        const err = new Error("Practice Record not created");
        res.status(404);
        return next(err);
    }
    res.status(200).json(updatedId);
};
exports.updatePractice = updatePractice;
const deletePractice = async (req, res, next) => {
    const practiceId = Number(req.params.practiceId);
    const deletedId = await practiceone_service_1.PracticeService.deletePractice(practiceId);
    if (!deletedId || deletedId === 0) {
        const err = new Error("Practice Record not created");
        res.status(404);
        return next(err);
    }
    res.status(200).json(deletedId);
};
exports.deletePractice = deletePractice;
