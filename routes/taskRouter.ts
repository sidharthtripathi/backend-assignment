import express from 'express'
import { taskSchema } from '../schema/taskSchema'
import { prisma } from '../lib/prisma'
import { Priority, Status } from '@prisma/client'
export const taskRouter = express.Router()
taskRouter.post('/',async(req,res)=>{
    try {
        const {description,priority,status,title} = taskSchema.parse(req.body)
        const task = await prisma.task.create({
            data : {title,description,priority,status,userId : req.userId}
        })
        res.status(201).json(task)
    } catch (error) {
        res.status(401).end()
    }
})

taskRouter.get("/",async(req,res)=>{
    const pageQuery = req.query.page as string
    const priority = req.query.priority as Priority
    const status = req.query.status as Status

    const take = 10;
    const skip = Number(pageQuery)*take
    console.log(priority)
    res.send("hello")
    const tasks = await prisma.task.findMany({
        where : {userId : req.userId,priority: priority===undefined ? Priority.MEDIUM : priority,status : status===undefined ? Status.COMPLETED : status},
        take,
        skip,
        omit : {userId:true}
    })
    res.json(tasks)
})

taskRouter.put('/:taskId',async(req,res)=>{
    const taskId = req.params.taskId
    const task = taskSchema.parse(req.body)
    const isAllowedToUpdate = await prisma.task.findUnique({
        where : {id:taskId,userId : req.userId}
    })
    if(!isAllowedToUpdate) res.status(401).end()
    const updatedTask = await prisma.task.update({
        where : {id : taskId},
        data : task
    })
    res.status(200).end()
})


taskRouter.delete('/:taskId',async(req,res)=>{
    try {
        const taskId = req.params.taskId;
        await prisma.task.delete({
            where : {id : taskId}
        })
        res.status(200).end()
    } catch (error) {
        res.status(400).end()
    }
})