import express from "express";
import {
  middleware as SupertokensMiddleware,
  errorHandler,
} from "supertokens-node/framework/express";
import SuperTokens from "supertokens-node";
import { backendConfig } from "./supertokens_config";
import actuator from "express-actuator";
import morgon from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import { SessionRequest } from "supertokens-node/framework/express";
import UserRoles from "supertokens-node/recipe/userroles";
import { Error as STError } from "supertokens-node/recipe/session";
import { verifySession } from "./verify_session";
import Session from "supertokens-node/recipe/session";

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

app.use(errorHandler());

app.post("/update-blog", verifySession(), async (req: SessionRequest, res) => {
  await Session.createNewSession(req, res, "public", req.user!);
  // user is an admin..
  res.send("success");
});
const port = process.env.PORT || 9000;
app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
