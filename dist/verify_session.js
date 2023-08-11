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
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const verifySession = () => {
    var client = (0, jwks_rsa_1.default)({
        jwksUri: process.env.JWKS_URI,
    });
    function getKey(header, callback) {
        client.getSigningKey(header.kid, function (err, key) {
            var signingKey = key === null || key === void 0 ? void 0 : key.getPublicKey();
            callback(err, signingKey);
        });
    }
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.headers.authorization) {
            return res
                .status(401)
                .send({ success: false, message: "Authorization header is required" });
        }
        const token = req.headers.authorization.split(" ")[1];
        jsonwebtoken_1.default.verify(token, getKey, {}, function (err, decoded) {
            if (err) {
                console.log(err);
                return res
                    .status(401)
                    .send({ success: false, message: "Invalid token" });
            }
            else {
                const userID = decoded === null || decoded === void 0 ? void 0 : decoded.sub;
                req.user = userID; // set the decoded token to the request object
                console.log("decoded token: ", decoded);
                console.log(req.user);
                next();
            }
        });
    });
};
exports.verifySession = verifySession;
