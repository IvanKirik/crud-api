import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { sendResponse, parseRequestBody, validateUUID } from './utils';

interface User {
    id: string;
    username: string;
    age: number;
    hobbies: string[];
}

const users: User[] = [];

export const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url!, true);
    const method = req.method;
    const path = parsedUrl.pathname!;
    const userId = path.split('/')[3];

    /** GET /api/users */
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
            const body = await parseRequestBody(req);
            const { username, age, hobbies } = body;

            if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
                return sendResponse(res, 400, { message: 'Invalid request body' });
            }

            const newUser: User = {
                id: uuidv4(),
                username,
                age,
                hobbies,
            };

            users.push(newUser);
            sendResponse(res, 201, newUser);
        } catch (err) {
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
            const body = await parseRequestBody(req);
            const { username, age, hobbies } = body;

            if (!username || typeof age !== 'number' || !Array.isArray(hobbies)) {
                return sendResponse(res, 400, { message: 'Invalid request body' });
            }

            users[userIndex] = { ...users[userIndex], username, age, hobbies };
            sendResponse(res, 200, users[userIndex]);
        } catch (err) {
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
    /** Unknown route */
    else {
        sendResponse(res, 404, { message: 'Resource not found' });
    }
};
