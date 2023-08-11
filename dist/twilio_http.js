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
exports.setNumber = void 0;
const graphql_request_1 = require("graphql-request");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const graphqlServer = process.env.GRAPHQL_SERVER;
//this sets req.number and req.verificationType
//which is coming form graphql.
const setNumber = () => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const userID = req.user;
        let verificationType = req.body.verificationType;
        if (verificationType === undefined || verificationType === null) {
            return res
                .status(400)
                .send({ success: false, message: "verificationType is required" });
        }
        else {
            if (verificationType !== "mobile" && verificationType !== "landline") {
                return res
                    .status(400)
                    .send({ success: false, message: "verificationType is invalid" });
            }
        }
        if (graphqlServer === undefined || userID === undefined)
            return res.status(500).send({ success: false, message: "Server error" });
        const graphQLClient = new graphql_request_1.GraphQLClient(graphqlServer, {
            headers: {
                authorization: req.headers.authorization,
            },
        });
        const query = (0, graphql_request_1.gql) `
              query GetUser($user_id: bpchar!) {
                user_profile_by_pk(user_id: $user_id) {
                  number: ${verificationType}
                }
              }
            `;
        try {
            const results = (yield graphQLClient.request(query, {
                user_id: userID,
            }));
            if (results.user_profile_by_pk === null) {
                return res.status(404).send("User not found");
            }
            const number = results.user_profile_by_pk.number;
            if (number === null) {
                return res
                    .status(404)
                    .send({ success: false, message: "Number not found" });
            }
            req.number = number;
            req.verificationType = verificationType;
            next();
            // Handle successful response
        }
        catch (error) {
            console.log(error);
            res.status(400).send({ success: false, message: "Server error" });
            // Handle error
        }
    });
};
exports.setNumber = setNumber;
