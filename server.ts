import express from "express";
import { middleware as SupertokensMiddleware} from "supertokens-node/framework/express"
import supertokens from "supertokens-node";
import dotenv from 'dotenv';
import { backendConfig } from "./config";
import actuator from 'express-actuator'
dotenv.config();
supertokens.init(backendConfig());


const app = express();

app.use(SupertokensMiddleware());

app.use(actuator());
const port = process.env.PORT;
const server = app.listen(port, async () => {
    
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  })

