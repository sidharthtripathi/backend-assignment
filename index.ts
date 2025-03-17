import express from 'express'
const server = express()
import { userRouter } from './routes/userRouter'
import bodyParser from 'body-parser'
server.use(bodyParser.json())
server.use('/api',userRouter)

server.listen(3000)