import cluster from 'cluster';
import { cpus } from 'os';
import { createServer, IncomingMessage, ServerResponse, request } from 'http';
import dotenv from 'dotenv';
import {sendResponse} from "./utils";
import {requestHandler} from "./router";

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const numCPUs = cpus().length;

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

        proxyReq.on('error', (err) => {
            console.error(`Error connecting to worker on port ${workerPort}: ${err.message}`);
            sendResponse(res, 500, { message: 'Internal server error' });
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
    const workerPort = Number(process.env.WORKER_PORT);

    if (!workerPort) {
        console.error('WORKER_PORT is not defined');
        process.exit(1);
    }

    createServer(requestHandler).listen(workerPort, () => {
        console.log(`Worker process is running on http://localhost:${workerPort}`);
    });
}
