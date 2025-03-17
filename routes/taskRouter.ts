import express from "express";
import { taskSchema } from "../schema/taskSchema";
import { prisma } from "../lib/prisma";
import { Priority, Status } from "@prisma/client";
import { redis } from "../lib/redis";
export const taskRouter = express.Router();
taskRouter.post("/", async (req, res) => {
  try {
    const { description, priority, status, title } = taskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { title, description, priority, status, userId: req.userId },
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(401).end();
  }
});

taskRouter.get("/", async (req, res) => {
  const pageQuery = req.query.page as string;
  const priority = req.query.priority as Priority;
  const status = req.query.status as Status;

  const take = 10;
  const skip = Number(pageQuery) * take;
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      priority: priority === undefined ? Priority.MEDIUM : priority,
      status: status === undefined ? Status.COMPLETED : status,
    },
    take,
    skip,
    omit: { userId: true },
  });
  res.json(tasks);
});

taskRouter.get("/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  // check cache first
  const cachedTaskExists = await redis.exists(`tasks:${taskId}`);
  if (cachedTaskExists) {
    const cachedTask = await redis.hgetall(`tasks:${taskId}`);
    if (cachedTask.userId !== req.userId) res.status(401).end();
    else res.json(cachedTask);
  } else {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) res.status(404).end();
    else {
      await redis.hset(`tasks:${taskId}`, task);
      res.json(task)
    }
  }
});

taskRouter.put("/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  const task = taskSchema.parse(req.body);
  const isAllowedToUpdate = await prisma.task.findUnique({
    where: { id: taskId, userId: req.userId },
  });
  if (!isAllowedToUpdate) res.status(401).end();
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: task,
    omit: { userId: true },
  });

  // invalidate cache
  await redis.hdel(`tasks:${taskId}`);
  res.status(200).end();
});

taskRouter.delete("/:taskId", async (req, res) => {
  try {
    const taskId = req.params.taskId;
    await prisma.task.delete({
      where: { id: taskId },
    });
    // invalidate cache
    await redis.hdel(`tasks:${taskId}`);
    res.status(200).end();
  } catch (error) {
    res.status(400).end();
  }
});
