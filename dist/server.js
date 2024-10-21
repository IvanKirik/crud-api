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
const http_1 = require("http");
const url_1 = require("url");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = process.env.PORT || 4000;
const users = [];
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};
const parseRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            }
            catch (err) {
                reject(err);
            }
        });
    });
};
const server = (0, http_1.createServer)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedUrl = (0, url_1.parse)(req.url, true);
    const method = req.method;
    const path = parsedUrl.pathname;
    const userId = path.split('/')[3];
    if (method === 'GET' && path === '/api/users') {
        sendResponse(res, 200, users);
    }
    /** GET /api/users/:userId */
    else if (method === 'GET' && path.startsWith('/api/users/') && userId) {
        if (!validateUUID(userId)) {
            return sendResponse(res, 400, { message: 'Invalid user ID format' });
        }
        const user = users.find(u => u.id === userId);
        if (!user) {
            return sendResponse(res, 404, { message: 'User not found' });
        }
        sendResponse(res, 200, user);
    }
    /** POST /api/users */
    else if (method === 'POST' && path === '/api/users') {
        try {
            const body = yield parseRequestBody(req);
            const { username, age, hobbies } = body;
            if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
                return sendResponse(res, 400, { message: 'Invalid request body' });
            }
            const newUser = {
                id: (0, uuid_1.v4)(),
                username,
                age,
                hobbies,
            };
            users.push(newUser);
            sendResponse(res, 201, newUser);
        }
        catch (err) {
            sendResponse(res, 400, { message: 'Invalid JSON format' });
        }
    }
    /** PUT /api/users/:userId */
    else if (method === 'PUT' && path.startsWith('/api/users/') && userId) {
        if (!validateUUID(userId)) {
            return sendResponse(res, 400, { message: 'Invalid user ID format' });
        }
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return sendResponse(res, 404, { message: 'User not found' });
        }
        try {
            const body = yield parseRequestBody(req);
            const { username, age, hobbies } = body;
            if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
                return sendResponse(res, 400, { message: 'Invalid request body' });
            }
            users[userIndex] = Object.assign(Object.assign({}, users[userIndex]), { username, age, hobbies });
            sendResponse(res, 200, users[userIndex]);
        }
        catch (err) {
            sendResponse(res, 400, { message: 'Invalid JSON format' });
        }
    }
    /** DELETE /api/users/:userId */
    else if (method === 'DELETE' && path.startsWith('/api/users/') && userId) {
        if (!validateUUID(userId)) {
            return sendResponse(res, 400, { message: 'Invalid user ID format' });
        }
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return sendResponse(res, 404, { message: 'User not found' });
        }
        users.splice(userIndex, 1);
        sendResponse(res, 204, {});
    }
    /** Неизвестный маршрут */
    else {
        sendResponse(res, 404, { message: 'Resource not found' });
    }
}));
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
function validateUUID(id) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
}
