import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifySession = () => {
  const certificate = process.env.JWKS_CERT!;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      return res.status(401).send("Authorization header is required");
    }

    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, certificate);
      const userID: string = decodedToken.sub as string;
      req.user = userID; // set the decoded token to the request object

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).send("Invalid token");
    }
  };
};
