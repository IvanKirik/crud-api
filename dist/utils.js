"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUID = exports.parseRequestBody = exports.sendResponse = void 0;
const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};
exports.sendResponse = sendResponse;
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
exports.parseRequestBody = parseRequestBody;
const validateUUID = (id) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
};
exports.validateUUID = validateUUID;
