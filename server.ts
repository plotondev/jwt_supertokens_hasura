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
import Session from "supertokens-node/recipe/session";
import { setWorkspaceForUser } from "./db/redis";

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

app.post("/wkspc", verifySession(), async (req: SessionRequest, res) => {
  const { workspace } = req.body;
  if (!workspace) {
    return res
      .status(400)
      .send({ success: false, message: "Workspace is required" });
  }
  await setWorkspaceForUser(req.user!, workspace);
  await Session.createNewSession(req, res, "public", req.user!);
  return res.status(200).send({ success: true });
});

const port = process.env.PORT || 9000;
app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
