"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const practiceone_route_1 = __importDefault(require("./practiceone.route"));
let apiRouter = (0, express_1.Router)();
apiRouter.get("/practices", practiceone_route_1.default);
exports.default = apiRouter;
