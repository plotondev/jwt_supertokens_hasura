import express from "express";

declare global {
  namespace Express {
    interface Request {
      session?: SessionContainerInterface | undefined;
      user?: string;
      number?: string;
      verificationType?: string;
    }
  }
}
