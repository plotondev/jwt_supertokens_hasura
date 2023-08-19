import { Pool } from "pg";

export default new Pool({
  max: process.env.DATABASE_MAX_CONNECTIONS as unknown as number,
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 30000,
  ssl: {
    rejectUnauthorized: false,
  },
});
