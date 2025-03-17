"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = void 0;
const zod_1 = require("zod");
exports.taskSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    status: zod_1.z.enum(["PENDING", "COMPLETED"]),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"])
});
