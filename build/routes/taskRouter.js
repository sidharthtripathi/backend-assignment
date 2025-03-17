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
exports.taskRouter = void 0;
const express_1 = __importDefault(require("express"));
const taskSchema_1 = require("../schema/taskSchema");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const zod_1 = require("zod");
exports.taskRouter = express_1.default.Router();
exports.taskRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { description, priority, status, title } = taskSchema_1.taskSchema.parse(req.body);
        const task = yield prisma_1.prisma.task.create({
            data: { title, description, priority, status, userId: req.userId },
        });
        res.status(201).json(task);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            res.status(400).end();
        else
            res.status(500).end();
    }
}));
exports.taskRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.userId);
    const page = req.query.page;
    let priority = req.query.priority;
    let status = req.query.status;
    const take = 10;
    const skip = Number(page === undefined ? 0 : Number(page)) * take;
    const tasks = yield prisma_1.prisma.task.findMany({
        where: Object.assign(Object.assign({ userId: req.userId }, (priority && { priority })), (status && { status })),
        take,
        skip,
        omit: { userId: true },
    });
    res.json(tasks);
}));
exports.taskRouter.get("/:taskId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.taskId;
    // check cache first
    const cachedTaskExists = yield redis_1.redis.exists(`tasks:${taskId}`);
    if (cachedTaskExists) {
        const cachedTask = yield redis_1.redis.hgetall(`tasks:${taskId}`);
        if (cachedTask.userId !== req.userId)
            res.status(401).end();
        else
            res.json(cachedTask);
    }
    else {
        const task = yield prisma_1.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task)
            res.status(404).end();
        else {
            yield redis_1.redis.hset(`tasks:${taskId}`, task);
            res.json(task);
        }
    }
}));
exports.taskRouter.put("/:taskId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.params.taskId;
    const task = taskSchema_1.taskSchema.parse(req.body);
    const isAllowedToUpdate = yield prisma_1.prisma.task.findUnique({
        where: { id: taskId, userId: req.userId },
    });
    if (!isAllowedToUpdate)
        res.status(401).end();
    const updatedTask = yield prisma_1.prisma.task.update({
        where: { id: taskId },
        data: task,
        omit: { userId: true },
    });
    // invalidate cache
    yield redis_1.redis.hdel(`tasks:${taskId}`);
    res.status(200).end();
}));
exports.taskRouter.delete("/:taskId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskId = req.params.taskId;
        yield prisma_1.prisma.task.delete({
            where: { id: taskId },
        });
        // invalidate cache
        yield redis_1.redis.hdel(`tasks:${taskId}`);
        res.status(200).end();
    }
    catch (error) {
        res.status(400).end();
    }
}));
