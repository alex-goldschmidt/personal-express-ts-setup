"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const practiceone_controller_1 = require("../controllers/practiceone.controller");
let practiceOneRouter = (0, express_1.Router)();
practiceOneRouter.get("/", practiceone_controller_1.getPractices);
exports.default = practiceOneRouter;
