"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("supertokens-node/framework/express");
const supertokens_node_1 = __importDefault(require("supertokens-node"));
const express_3 = require("supertokens-node/recipe/session/framework/express");
const graphql_request_1 = require("graphql-request");
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const express_actuator_1 = __importDefault(require("express-actuator"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const twilio_1 = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const TwilioClient = new twilio_1.Twilio(accountSid, authToken);
dotenv_1.default.config();
supertokens_node_1.default.init((0, config_1.backendConfig)());
const graphqlServer = process.env.GRAPHQL_SERVER;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.APP_URL,
    allowedHeaders: ["content-type", ...supertokens_node_1.default.getAllCORSHeaders()],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
}));
app.use((0, express_2.middleware)()); // supertokens middleware creates /api path
app.use((0, morgan_1.default)("combined")); //http logging
app.use((0, express_actuator_1.default)()); //health check
app.post("/verify_number", (0, express_3.verifySession)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let session = req.session;
    let userID = session.getUserId();
    let verificationType = req.body.verificationType;
    if (verificationType === undefined || verificationType === null) {
        return res.status(400).send("verificationType is required");
    }
    else {
        verificationType = verificationType.toString();
        if (verificationType !== "mobile" || verificationType !== "landline") {
            return res.status(400).send("verificationType is invalid");
        }
    }
    if (graphqlServer === undefined || userID === undefined)
        return res.send(500);
    const graphQLClient = new graphql_request_1.GraphQLClient(graphqlServer, {
        headers: {
            authorization: "Authorization " + session.getAccessTokenPayload()["jwt"],
        },
    });
    const query = (0, graphql_request_1.gql) `
    query MyQuery($user_id: bpchar!) {
      c2c_user_profile_by_pk(user_id: $user_id) {
        mobile
        landline
      }
    }
  `;
    const results = (yield graphQLClient.request(query, {
        user_id: userID,
    }));
    res.json(results[0]);
}));
const port = process.env.PORT;
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
}));
