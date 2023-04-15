import express from "express";
import { middleware as SupertokensMiddleware } from "supertokens-node/framework/express";
import SuperTokens from "supertokens-node";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { request, gql, GraphQLClient } from "graphql-request";
import dotenv from "dotenv";
import { backendConfig } from "./config";
import actuator from "express-actuator";
import morgon from "morgan";
import cors from "cors";
import { Twilio } from "twilio";

type ProfileSchema = {
  id: number;
  first_name: string;
  last_name: string;
  landline: string;
  mobile: string;
  preferred_number: string;
  address_unit: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  timezone: string;
};

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const TwilioClient = new Twilio(accountSid, authToken);

dotenv.config();
SuperTokens.init(backendConfig());

const graphqlServer = process.env.GRAPHQL_SERVER;
const app = express();
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

app.post("/verify_number", verifySession(), async (req, res) => {
  let session = req.session;
  let userID = session.getUserId();
  let verificationType = req.body.verificationType;
  if (verificationType === undefined || verificationType === null) {
    return res.status(400).send("verificationType is required");
  } else {
    verificationType = verificationType.toString();
    if (verificationType !== "mobile" || verificationType !== "landline") {
      return res.status(400).send("verificationType is invalid");
    }
  }
  if (graphqlServer === undefined || userID === undefined) return res.send(500);

  const graphQLClient = new GraphQLClient(graphqlServer, {
    headers: {
      authorization: "Authorization " + session.getAccessTokenPayload()["jwt"],
    },
  });
  const query = gql`
    query MyQuery($user_id: bpchar!) {
      c2c_user_profile_by_pk(user_id: $user_id) {
        mobile
        landline
      }
    }
  `;
  const results = (await graphQLClient.request(query, {
    user_id: userID,
  })) as ProfileSchema[];
  res.json(results[0]);
});

const port = process.env.PORT;
app.listen(port, async () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
