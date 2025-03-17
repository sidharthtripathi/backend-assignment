"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRouter_1 = require("./routes/userRouter");
const taskRouter_1 = require("./routes/taskRouter");
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const server = (0, express_1.default)();
server.use((0, cookie_parser_1.default)());
server.use(body_parser_1.default.json());
server.use('/api/auth', userRouter_1.userRouter);
server.use("/api/tasks", (req, res, next) => {
    const token = req.cookies.token;
    if (!token)
        res.status(401).end();
    else {
        try {
            const payload = (jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET));
            req.userId = payload.id;
            next();
        }
        catch (error) {
            res.status(401).end();
        }
    }
}, taskRouter_1.taskRouter);
server.listen(3000);
