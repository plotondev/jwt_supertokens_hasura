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
exports.verifyCode = exports.initiateCall = exports.setNumber = void 0;
const graphql_request_1 = require("graphql-request");
const twilio_1 = require("twilio");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const graphqlServer = process.env.GRAPHQL_SERVER;
//this sets req.number and req.verificationType
//which is coming form graphql.
const setNumber = () => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.headers.authorization) {
            return res.status(401).send("Authorization header is required");
        }
        const userID = req.user;
        let verificationType = req.body.verificationType;
        if (verificationType === undefined || verificationType === null) {
            return res.status(400).send("verificationType is required");
        }
        else {
            if (verificationType !== "mobile" && verificationType !== "landline") {
                return res.status(400).send("verificationType is invalid");
            }
        }
        if (graphqlServer === undefined || userID === undefined)
            return res.send(500);
        const graphQLClient = new graphql_request_1.GraphQLClient(graphqlServer, {
            headers: {
                authorization: req.headers.authorization,
            },
        });
        const query = (0, graphql_request_1.gql) `
              query MyQuery($user_id: bpchar!) {
                c2c_user_profile_by_pk(user_id: $user_id) {
                  number: ${verificationType}
                }
              }
            `;
        try {
            const results = (yield graphQLClient.request(query, {
                user_id: userID,
            }));
            if (results.c2c_user_profile_by_pk === null) {
                return res.status(404).send("User not found");
            }
            const number = results.c2c_user_profile_by_pk.number;
            if (number === null) {
                return res.status(404).send("Number not found");
            }
            req.number = number;
            req.verificationType = verificationType;
            next();
            // Handle successful response
        }
        catch (error) {
            console.log(error);
            res.send(500);
            // Handle error
        }
    });
};
exports.setNumber = setNumber;
const initiateCall = () => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const number = req.number;
        const extension = process.env.TWILIO_COUNTRY_EXTENSION;
        if (!number || !extension) {
            return res.status(400).send("Number and extension are required");
        }
        try {
            const TwilioClient = new twilio_1.Twilio(accountSid, authToken);
            const verification = yield TwilioClient.verify.v2
                .services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verifications.create({
                to: `${extension}${number}`,
                channel: "call",
            });
            console.log(verification);
            return res.status(200).send("Verification call sent successfully");
        }
        catch (error) {
            console.log(error);
            return res.status(500).send("Error sending verification call");
        }
    });
};
exports.initiateCall = initiateCall;
const verifyCode = () => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const number = req.number;
        const extension = process.env.TWILIO_COUNTRY_EXTENSION;
        const adminKey = process.env.HASURA_ADMIN_SECRET;
        const verificationType = req.verificationType;
        const userID = req.user;
        const code = req.body.code;
        if (!number ||
            !extension ||
            !code ||
            !adminKey ||
            !verificationType ||
            !userID) {
            return res
                .status(400)
                .send("userID, Extension, Number , code , adminKey and verificationType are required");
        }
        const TwilioClient = new twilio_1.Twilio(accountSid, authToken);
        yield TwilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({
            to: `${extension}${number}`,
            code: code,
        })
            .then((check) => __awaiter(void 0, void 0, void 0, function* () {
            if (check.status === "approved") {
                const graphQLClient = new graphql_request_1.GraphQLClient(graphqlServer, {
                    headers: {
                        "X-Hasura-Admin-Secret": adminKey,
                    },
                });
                const query = (0, graphql_request_1.gql) `
            mutation MyMutation(
              $${verificationType}_verified: Boolean = false
              $user_id: bpchar = ""
            ) {
              update_c2c_user_profile_by_pk(
                pk_columns: { user_id: $user_id }
                _set: {
                  ${verificationType}_verified: $${verificationType}_verified
                }
              ) {
                id
              }
            }
          `;
                try {
                    const results = (yield graphQLClient.request(query, {
                        user_id: userID,
                        [verificationType + "_verified"]: true,
                    }));
                    console.log(results);
                    res.status(200);
                    res.send({
                        success: true,
                        message: "Verification success.",
                    });
                }
                catch (error) {
                    console.error(error);
                    // Handle error here
                    res.status(400);
                    res.send({
                        success: false,
                        message: "Server error.",
                    });
                }
                return;
            }
            else {
                res.status(401);
                res.send({
                    success: false,
                    message: "Incorrect token.",
                });
                return;
            }
        }))
            .catch((error) => {
            console.log(error);
            res.status(error.status);
            res.send({
                success: false,
                message: error.message,
            });
            return;
        });
    });
};
exports.verifyCode = verifyCode;
