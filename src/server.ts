import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 4000;

interface User {
    id: string;
    username: string;
    age: number;
    hobbies: string[];
}

const users: User[] = [];

const sendResponse = (res: ServerResponse, statusCode: number, data: any) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const parseRequestBody = (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });
    });
};


const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url!, true);
    const method = req.method;
    const path = parsedUrl.pathname!;
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
    /** Неизвестный маршрут */
    else {
        sendResponse(res, 404, { message: 'Resource not found' });
    }
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

function validateUUID(id: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
}
