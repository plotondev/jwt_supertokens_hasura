import { GraphQLClient, gql } from "graphql-request";
import { SessionRequest } from "supertokens-node/framework/express";
import { Twilio } from "twilio";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
export type GraphQLResp = {
  c2c_user_profile_by_pk: {
    number: string;
  };
};
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const graphqlServer = process.env.GRAPHQL_SERVER!;

//this sets req.number and req.verificationType
//which is coming form graphql.
export const setNumber = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userID = req.user;
    let verificationType: string = req.body.verificationType;
    if (verificationType === undefined || verificationType === null) {
      return res
        .status(400)
        .send({ success: false, message: "verificationType is required" });
    } else {
      if (verificationType !== "mobile" && verificationType !== "landline") {
        return res
          .status(400)
          .send({ success: false, message: "verificationType is invalid" });
      }
    }
    if (graphqlServer === undefined || userID === undefined)
      return res.status(500).send({ success: false, message: "Server error" });

    const graphQLClient = new GraphQLClient(graphqlServer, {
      headers: {
        authorization: req.headers.authorization!,
      },
    });
    const query = gql`
              query MyQuery($user_id: bpchar!) {
                c2c_user_profile_by_pk(user_id: $user_id) {
                  number: ${verificationType}
                }
              }
            `;
    try {
      const results = (await graphQLClient.request(query, {
        user_id: userID,
      })) as GraphQLResp;
      if (results.c2c_user_profile_by_pk === null) {
        return res.status(404).send("User not found");
      }
      const number = results.c2c_user_profile_by_pk.number;
      if (number === null) {
        return res
          .status(404)
          .send({ success: false, message: "Number not found" });
      }
      req.number = number;
      req.verificationType = verificationType;
      next();
      // Handle successful response
    } catch (error) {
      console.log(error);
      res.send(500);
      // Handle error
    }
  };
};

export const initiateCall = () => {
  return async (req: SessionRequest, res: Response) => {
    const number = req.number;

    const extension = process.env.TWILIO_COUNTRY_EXTENSION;
    if (!number || !extension) {
      return res
        .status(400)
        .send({ success: false, message: "Number and extension are required" });
    }
    try {
      const TwilioClient = new Twilio(accountSid, authToken);
      const verification = await TwilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verifications.create({
          to: `${extension}${number}`,
          channel: "call",
        });
      console.log(verification);
      return res.status(200).send({
        success: true,
        message: "Verification call sent successfully",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send({ success: false, message: "Error sending verification call" });
    }
  };
};

export const verifyCode = () => {
  return async (req: SessionRequest, res: Response) => {
    const number = req.number;
    const extension = process.env.TWILIO_COUNTRY_EXTENSION;
    const adminKey = process.env.HASURA_ADMIN_SECRET;
    const verificationType = req.verificationType;
    const userID = req.user;
    const code = req.body.code;
    if (
      !number ||
      !extension ||
      !code ||
      !adminKey ||
      !verificationType ||
      !userID
    ) {
      return res.status(400).send({
        success: false,
        message:
          "Number, extension, code, adminKey, verificationType and userID are required",
      });
    }
    const TwilioClient = new Twilio(accountSid, authToken);
    await TwilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: `${extension}${number}`,
        code: code,
      })
      .then(async (check) => {
        if (check.status === "approved") {
          const graphQLClient = new GraphQLClient(graphqlServer!, {
            headers: {
              "X-Hasura-Admin-Secret": adminKey,
            },
          });
          const query = gql`
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
            const results = (await graphQLClient.request(query, {
              user_id: userID,
              [verificationType + "_verified"]: true,
            })) as GraphQLResp;
            console.log(results);
            res.status(200);
            res.send({
              success: true,
              message: "Verification success.",
            });
          } catch (error) {
            console.error(error);
            // Handle error here
            res.status(400);
            res.send({
              success: false,
              message: "Server error.",
            });
          }

          return;
        } else {
          res.status(401);
          res.send({
            success: false,
            message: "Incorrect token.",
          });
          return;
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(error.status);
        res.send({
          success: false,
          message: error.message,
        });
        return;
      });
  };
};
