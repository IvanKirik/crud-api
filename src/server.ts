import { createServer, IncomingMessage, ServerResponse, request } from 'http';
import { parse } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import cluster from 'cluster';
import { cpus } from 'os';

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const numCPUs = cpus().length;

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

const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url!, true);
    const method = req.method;
    const path = parsedUrl.pathname!;
    const userId = path.split('/')[3]; // Извлечение userId из URL

    if (method === 'GET' && path === '/api/users') {
        sendResponse(res, 200, users);
    }
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
    else {
        sendResponse(res, 404, { message: 'Resource not found' });
    }
};

function validateUUID(id: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
}

if (cluster.isMaster) {
    console.log(`Master process is running on ${process.pid}`);

    for (let i = 0; i < numCPUs - 1; i++) {
        cluster.fork({ WORKER_PORT: port + i + 1 });
    }

    let currentWorkerIndex = 0;
    const workerPorts = Array.from({ length: numCPUs - 1 }, (_, i) => port + i + 1);

    const loadBalancer = (req: IncomingMessage, res: ServerResponse) => {
        const workerPort = workerPorts[currentWorkerIndex];
        currentWorkerIndex = (currentWorkerIndex + 1) % workerPorts.length;

        const options = {
            hostname: 'localhost',
            port: workerPort,
            path: req.url,
            method: req.method,
            headers: req.headers,
        };

        const proxyReq = request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode!, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });

        req.pipe(proxyReq, { end: true });
    };

    createServer(loadBalancer).listen(port, () => {
        console.log(`Load balancer running on http://localhost:${port}`);
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });

} else {
    const workerPort = process.env.WORKER_PORT;
    createServer(requestHandler).listen(workerPort, () => {
        console.log(`Worker process is running on http://localhost:${workerPort}`);
    });
}
