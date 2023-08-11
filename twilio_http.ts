import { GraphQLClient, gql } from "graphql-request";

import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
export type GraphQLResp = {
  user_profile_by_pk: {
    number: string;
  };
};
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
              query GetUser($user_id: bpchar!) {
                user_profile_by_pk(user_id: $user_id) {
                  number: ${verificationType}
                }
              }
            `;
    try {
      const results = (await graphQLClient.request(query, {
        user_id: userID,
      })) as GraphQLResp;
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
    } catch (error) {
      console.log(error);
      res.status(400).send({ success: false, message: "Server error" });
      // Handle error
    }
  };
};
