import express from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
const server = express()
import { userRouter } from './routes/userRouter'
import { taskRouter } from './routes/taskRouter'
import bodyParser from 'body-parser'
server.use(bodyParser.json())
server.use('/api/auth',userRouter)
server.use("/api/tasks",(req,res,next)=>{
    const token = req.headers.token as string
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