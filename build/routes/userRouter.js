"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const authSchema_1 = require("../schema/authSchema");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const library_1 = require("@prisma/client/runtime/library");
exports.userRouter = express_1.default.Router();
exports.userRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = authSchema_1.authSchema.parse(req.body);
        const user = yield prisma_1.prisma.user.findUnique({
            where: { username },
        });
        if (!user)
            res.status(400).end();
        else {
            const passwordMatch = yield bcrypt_1.default.compare(password, user.password);
            if (!passwordMatch)
                res.status(401).end();
            else {
                res
                    .cookie("token", jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET), { secure: true, httpOnly: true })
                    .status(200)
                    .end();
            }
        }
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            res.status(400).end();
        else
            res.status(500).end();
    }
}));
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = authSchema_1.authSchema.parse(req.body);
        const user = yield prisma_1.prisma.user.create({
            data: { username, password: yield bcrypt_1.default.hash(password, 10) },
        });
        res.status(201).json({ id: user.id, username });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            res.status(400).end();
        else if (error instanceof library_1.PrismaClientKnownRequestError) {
            res.statusMessage = "USERNAME ALREADY TAKEN",
                res.status(400).end();
        }
    }
}));
