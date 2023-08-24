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
exports.saveTokens = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("./db"));
const algorithm = "aes-256-cbc";
const saveTokens = (data, userId, oauthProvider) => __awaiter(void 0, void 0, void 0, function* () {
    const key = crypto_1.default.randomBytes(32);
    const iv = crypto_1.default.randomBytes(16);
    let cipher = crypto_1.default.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    let client;
    try {
        client = yield db_1.default.connect();
        // Check if a record exists
        const checkSql = `SELECT 1 FROM oauth2_tokens WHERE user_id = $1 AND oauth_provider = $2`;
        const result = yield (client === null || client === void 0 ? void 0 : client.query(checkSql, [userId, oauthProvider]));
        if (result.rowCount > 0) {
            // Update if exists
            const updateSql = `UPDATE oauth2_tokens SET iv = $1, key = $2, oauth_data = $3 WHERE user_id = $4 AND oauth_provider = $5`;
            yield (client === null || client === void 0 ? void 0 : client.query(updateSql, [
                iv.toString("hex"),
                key.toString("hex"),
                encrypted.toString("hex"),
                userId,
                oauthProvider,
            ]));
        }
        else {
            // Insert if doesn't exist
            const insertSql = `INSERT INTO oauth2_tokens (user_id, iv, key, oauth_data, oauth_provider) VALUES ($1, $2, $3, $4, $5)`;
            yield (client === null || client === void 0 ? void 0 : client.query(insertSql, [
                userId,
                iv.toString("hex"),
                key.toString("hex"),
                encrypted.toString("hex"),
                oauthProvider,
            ]));
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        client === null || client === void 0 ? void 0 : client.release();
    }
});
exports.saveTokens = saveTokens;
//example of how to get oauth2 tokens
// export const getTokens = async (userId: string, oauthProvider: string) => {
//   let res: any;
//   try {
//     const client = await pool.connect();
//     const sql = `SELECT iv,key,oauth_data FROM oauth2_tokens WHERE user_id = $1 AND oauth_provider = $2`;
//     res = await client.query(sql, [userId, oauthProvider]);
//   } catch (e) {
//     console.log(e);
//     console.log("error in getTokens");
//   }
//   console.log(res.rows[0]);
//   let iv = Buffer.from(res.rows[0]["iv"], "hex");
//   let encryptedText = Buffer.from(res.rows[0]["oauth_data"], "hex");
//   let decipher = crypto.createDecipheriv(
//     algorithm,
//     Buffer.from(res.rows[0]["key"], "hex"),
//     iv
//   );
//   let decrypted = decipher.update(encryptedText);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   return decrypted.toString();
// };
