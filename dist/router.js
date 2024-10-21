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
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestHandler = void 0;
const url_1 = require("url");
const uuid_1 = require("uuid");
const utils_1 = require("./utils");
const users = []; // Храним данные пользователей
const requestHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedUrl = (0, url_1.parse)(req.url, true);
    const method = req.method;
    const path = parsedUrl.pathname;
    const userId = path.split('/')[3]; // Извлечение userId из URL
    // GET /api/users
    if (method === 'GET' && path === '/api/users') {
        (0, utils_1.sendResponse)(res, 200, users);
    }
    // GET /api/users/:userId
    else if (method === 'GET' && path.startsWith('/api/users/') && userId) {
        if (!(0, utils_1.validateUUID)(userId)) {
            return (0, utils_1.sendResponse)(res, 400, { message: 'Invalid user ID format' });
        }
        const user = users.find(u => u.id === userId);
        if (!user) {
            return (0, utils_1.sendResponse)(res, 404, { message: 'User not found' });
        }
        (0, utils_1.sendResponse)(res, 200, user);
    }
    // POST /api/users
    else if (method === 'POST' && path === '/api/users') {
        try {
            const body = yield (0, utils_1.parseRequestBody)(req);
            const { username, age, hobbies } = body;
            if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
                return (0, utils_1.sendResponse)(res, 400, { message: 'Invalid request body' });
            }
            const newUser = {
                id: (0, uuid_1.v4)(),
                username,
                age,
                hobbies,
            };
            users.push(newUser);
            (0, utils_1.sendResponse)(res, 201, newUser);
        }
        catch (err) {
            (0, utils_1.sendResponse)(res, 400, { message: 'Invalid JSON format' });
        }
    }
    // PUT /api/users/:userId
    else if (method === 'PUT' && path.startsWith('/api/users/') && userId) {
        if (!(0, utils_1.validateUUID)(userId)) {
            return (0, utils_1.sendResponse)(res, 400, { message: 'Invalid user ID format' });
        }
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return (0, utils_1.sendResponse)(res, 404, { message: 'User not found' });
        }
        try {
            const body = yield (0, utils_1.parseRequestBody)(req);
            const { username, age, hobbies } = body;
            if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
                return (0, utils_1.sendResponse)(res, 400, { message: 'Invalid request body' });
            }
            users[userIndex] = Object.assign(Object.assign({}, users[userIndex]), { username, age, hobbies });
            (0, utils_1.sendResponse)(res, 200, users[userIndex]);
        }
        catch (err) {
            (0, utils_1.sendResponse)(res, 400, { message: 'Invalid JSON format' });
        }
    }
    // DELETE /api/users/:userId
    else if (method === 'DELETE' && path.startsWith('/api/users/') && userId) {
        if (!(0, utils_1.validateUUID)(userId)) {
            return (0, utils_1.sendResponse)(res, 400, { message: 'Invalid user ID format' });
        }
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return (0, utils_1.sendResponse)(res, 404, { message: 'User not found' });
        }
        users.splice(userIndex, 1);
        (0, utils_1.sendResponse)(res, 204, {});
    }
    // Неизвестный маршрут
    else {
        (0, utils_1.sendResponse)(res, 404, { message: 'Resource not found' });
    }
});
exports.requestHandler = requestHandler;
