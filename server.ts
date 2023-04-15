import express from "express";
import {
  middleware as SupertokensMiddleware,
  errorHandler,
} from "supertokens-node/framework/express";
import SuperTokens from "supertokens-node";
import { verifySession } from "./verify_session";
import dotenv from "dotenv";
import { backendConfig } from "./config";
import actuator from "express-actuator";
import morgon from "morgan";
import cors from "cors";
import bodyParser from "body-parser";

import { initiateCall, setNumber, verifyCode } from "./twilio_http";

dotenv.config();

SuperTokens.init(backendConfig());

const app = express();
app.use(bodyParser.json());
app.use(
  cors({
    origin: process.env.APP_URL!,
    allowedHeaders: ["content-type", ...SuperTokens.getAllCORSHeaders()],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
  })
);

app.use(SupertokensMiddleware()); // supertokens middleware creates /api path
app.use(morgon("combined")); //http logging
app.use(actuator()); //health check

app.post("/start_verification", verifySession(), setNumber(), initiateCall());

app.post("/verify_code", verifySession(), setNumber(), verifyCode());
app.use(errorHandler());
const port = process.env.PORT;
app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
