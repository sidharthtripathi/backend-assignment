import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { userRouter } from './routes/userRouter'
import { taskRouter } from './routes/taskRouter'
import bodyParser from 'body-parser'
dotenv.config()
const server = express()
server.use(cookieParser())
server.use(bodyParser.json())
server.use('/api/auth',userRouter)
server.use("/api/tasks",(req,res,next)=>{
    const token = req.cookies.token
    if(!token) res.status(401).end()
    else{
        try {
            const payload = (jwt.verify(token,process.env.JWT_SECRET as string)) as JwtPayload
            req.userId = payload.id
            next()
        } catch (error) {
            res.status(401).end()
        }
        
    }
},taskRouter)
server.listen(3000)