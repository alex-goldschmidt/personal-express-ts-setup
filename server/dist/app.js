"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const process_1 = __importDefault(require("process"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use((0, cors_1.default)());
dotenv_1.default.config();
app.use("/api", routes_1.default);
app.use((req, res) => {
    res.status(404 /* HttpStatusCode.NOT_FOUND */).json({
        statusCode: 404 /* HttpStatusCode.NOT_FOUND */,
        message: `${req.method} ${req.originalUrl} Not Found`,
    });
});
app.use(error_middleware_1.errorHandler);
const port = process_1.default.env.PORT;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
exports.default = app;
