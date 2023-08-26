import crypto from "crypto";
import { PoolClient } from "pg";
import { pg } from "./db/pg";

const algorithm = "aes-256-cbc";

export const saveTokens = async (
  data: string,
  userId: string,
  oauthProvider: string
) => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  let client: PoolClient | undefined;
  try {
    client = await pg.connect();

    // Check if a record exists
    const checkSql = `SELECT 1 FROM oauth2_tokens WHERE user_id = $1 AND oauth_provider = $2`;
    const result = await client?.query(checkSql, [userId, oauthProvider]);

    if (result.rowCount > 0) {
      // Update if exists
      const updateSql = `UPDATE oauth2_tokens SET iv = $1, key = $2, oauth_data = $3 WHERE user_id = $4 AND oauth_provider = $5`;
      await client?.query(updateSql, [
        iv.toString("hex"),
        key.toString("hex"),
        encrypted.toString("hex"),
        userId,
        oauthProvider,
      ]);
    } else {
      // Insert if doesn't exist
      const insertSql = `INSERT INTO oauth2_tokens (user_id, iv, key, oauth_data, oauth_provider) VALUES ($1, $2, $3, $4, $5)`;
      await client?.query(insertSql, [
        userId,
        iv.toString("hex"),
        key.toString("hex"),
        encrypted.toString("hex"),
        oauthProvider,
      ]);
    }
  } catch (e) {
    console.log(e);
  } finally {
    client?.release();
  }
};

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
