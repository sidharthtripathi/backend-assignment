import { password } from 'bun'
import {z} from 'zod'
export const authSchema = z.object({
    username : z.string(),
    password : z.string()
})