
import {z} from 'zod'
export const taskSchema = z.object({
    title : z.string(),
    description : z.string(),
    status : z.enum(["PENDING","COMPLETED"]),
    priority : z.enum(["LOW","MEDIUM","HIGH"])

})