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
import { verifySession } from "./verify_session";

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

//This is for k8 ingress to perform auth on Authorization header.
//The return sets a header as userID which is passed on to proxy servers
app.post("/",verifySession(), async (req: SessionRequest, res) => {
  return res.header("X-Auth-Request-User",req.user).status(200).send();
});
app.post("/test", verifySession(), function (req, res) {
  res.send("Hello there! \n" + req.user + " \n" + req.verificationType);
});

const port = process.env.PORT || 9000;
app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
