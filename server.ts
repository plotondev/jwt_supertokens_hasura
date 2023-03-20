import express from "express";
import { middleware as SupertokensMiddleware} from "supertokens-node/framework/express"
import supertokens from "supertokens-node";
import dotenv from 'dotenv';
import { backendConfig } from "./config";
import actuator from 'express-actuator'
import morgon from 'morgan'
import cors from 'cors'
dotenv.config()
supertokens.init(backendConfig())


const app = express();

app.use(SupertokensMiddleware())
app.use(morgon('combined'))
app.use(actuator())
app.use(cors())

const port = process.env.PORT;
app.listen(port, async () => {    
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})

