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
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const express_actuator_1 = __importDefault(require("express-actuator"));
dotenv_1.default.config();
supertokens_node_1.default.init((0, config_1.backendConfig)());
const app = (0, express_1.default)();
app.use((0, express_2.middleware)());
app.use((0, express_actuator_1.default)());
const port = process.env.PORT;
const server = app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
}));
