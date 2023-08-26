import { Request, Response, NextFunction } from "express";
import JsonWebToken, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export const verifySession = () => {
  var client = jwksClient({
    jwksUri: process.env.JWKS_URI as string,
  });
  function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    client.getSigningKey(header.kid, function (err, key) {
      var signingKey = key?.getPublicKey();
      callback(err, signingKey);
    });
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      return res
        .status(401)
        .send({ success: false, message: "Authorization header is required" });
    }

    const token = req.headers.authorization.split(" ")[1];

    JsonWebToken.verify(token, getKey, {}, function (err, decoded) {
      if (err) {
        console.log(err);
        return res
          .status(401)
          .send({ success: false, message: "Invalid token" });
      } else {
        const userID: string = decoded?.sub as string;

        req.user = userID; // set the decoded token to the request object
        next();
      }
    });
  };
};
