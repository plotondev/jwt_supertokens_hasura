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
const express_1 = __importDefault(require("express"));
const express_2 = require("supertokens-node/framework/express");
const supertokens_node_1 = __importDefault(require("supertokens-node"));
const supertokens_config_1 = require("./supertokens_config");
const express_actuator_1 = __importDefault(require("express-actuator"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
supertokens_node_1.default.init((0, supertokens_config_1.backendConfig)());
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.APP_URL,
    allowedHeaders: ["content-type", ...supertokens_node_1.default.getAllCORSHeaders()],
    methods: ["GET", "PUT", "POST", "DELETE"],
    credentials: true,
}));
app.use((0, express_2.middleware)()); // supertokens middleware creates /api path
app.use((0, morgan_1.default)("combined")); //http logging
app.use((0, express_actuator_1.default)()); //health check
app.use((0, express_2.errorHandler)());
const port = 9000;
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
}));
