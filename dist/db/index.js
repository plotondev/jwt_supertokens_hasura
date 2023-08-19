"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
exports.default = new pg_1.Pool({
    max: process.env.DATABASE_MAX_CONNECTIONS,
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false,
    },
});
