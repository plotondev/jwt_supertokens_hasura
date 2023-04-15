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
exports.verifySession = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifySession = () => {
    const certificate = process.env.JWKS_CERT;
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.headers.authorization) {
            return res.status(401).send("Authorization header is required");
        }
        const token = req.headers.authorization.split(" ")[1];
        try {
            const decodedToken = jsonwebtoken_1.default.verify(token, certificate);
            const userID = decodedToken.sub;
            req.user = userID; // set the decoded token to the request object
            next();
        }
        catch (error) {
            console.error(error);
            return res.status(401).send("Invalid token");
        }
    });
};
exports.verifySession = verifySession;
