"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const router_1 = require("./router");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = Number(process.env.PORT) || 4000;
(0, http_1.createServer)(router_1.requestHandler).listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
