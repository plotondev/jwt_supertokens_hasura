"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
exports.default = new pg_1.Pool({
    max: 20,
    connectionString: "postgres://hiteshjoshi:dKqgDoPr8yt9@ep-shiny-violet-54110484-pooler.ap-southeast-1.aws.neon.tech/positive-lion-42_db_1908622",
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false,
    },
});
