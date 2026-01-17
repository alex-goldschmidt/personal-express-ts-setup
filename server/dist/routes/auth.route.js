"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
let authRouter = (0, express_1.Router)();
authRouter.post("/register", auth_controller_1.signUp);
authRouter.get("/:userId", auth_controller_1.getUserById);
authRouter.post("/signIn", auth_controller_1.signIn);
exports.default = authRouter;
