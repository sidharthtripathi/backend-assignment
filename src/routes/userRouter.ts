import express from "express";
import { authSchema } from "../schema/authSchema";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
export const userRouter = express.Router();
userRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = authSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) res.status(400).end();
    else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) res.status(401).end();
      else {
        res
          .cookie(
            "token",
            jwt.sign({ id: user.id }, process.env.JWT_SECRET as string),
            { secure: true, httpOnly: true }
          )
          .status(200)
          .end();
      }
    }
  } catch (error) {
    if (error instanceof ZodError) res.status(400).end();
    else res.status(500).end();
  }
});

userRouter.post("/signup", async (req, res) => {
  try {
    const { username, password } = authSchema.parse(req.body);
    const user = await prisma.user.create({
      data: { username, password: await bcrypt.hash(password, 10) },
    });
    res.status(201).json({ id: user.id, username });
  } catch (error) {
    if (error instanceof ZodError) res.status(400).end();
    else if(error instanceof PrismaClientKnownRequestError){
        res.statusMessage = "USERNAME ALREADY TAKEN",
        res.status(400).end()
    }
  }
});
