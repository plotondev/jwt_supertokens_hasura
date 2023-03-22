import express from "express"
import { middleware as SupertokensMiddleware} from "supertokens-node/framework/express"
import SuperTokens from "supertokens-node"
import dotenv from 'dotenv'
import { backendConfig } from "./config"
import actuator from 'express-actuator'
import morgon from 'morgan'
import cors from 'cors'
dotenv.config()
SuperTokens.init(backendConfig())


const app = express()
app.use(
    cors({
      origin: process.env.ALLOWED_CORS_ORIGINS!,
      allowedHeaders: ["content-type", ...SuperTokens.getAllCORSHeaders()],
      methods: ["GET", "PUT", "POST", "DELETE"],
      credentials: true,
    })  
)
app.use(SupertokensMiddleware()) // supertokens middleware creates /api path
app.use(morgon('combined')) //http logging
app.use(actuator()) //health check


const port = process.env.PORT
app.listen(port, async () => {    
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})