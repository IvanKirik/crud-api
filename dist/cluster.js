"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = require("os");
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("./utils");
const router_1 = require("./router");
dotenv_1.default.config();
const port = Number(process.env.PORT) || 4000;
const numCPUs = (0, os_1.cpus)().length;
if (cluster_1.default.isMaster) {
    console.log(`Master process is running on ${process.pid}`);
    // Создаем воркеры
    for (let i = 0; i < numCPUs - 1; i++) {
        cluster_1.default.fork({ WORKER_PORT: port + i + 1 });
    }
    // Балансировщик нагрузки (Round-robin)
    let currentWorkerIndex = 0;
    const workerPorts = Array.from({ length: numCPUs - 1 }, (_, i) => port + i + 1);
    const loadBalancer = (req, res) => {
        const workerPort = workerPorts[currentWorkerIndex];
        currentWorkerIndex = (currentWorkerIndex + 1) % workerPorts.length;
        const options = {
            hostname: 'localhost',
            port: workerPort,
            path: req.url,
            method: req.method,
            headers: req.headers,
        };
        const proxyReq = (0, http_1.request)(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });
        // Обработка ошибок соединения
        proxyReq.on('error', (err) => {
            console.error(`Error connecting to worker on port ${workerPort}: ${err.message}`);
            (0, utils_1.sendResponse)(res, 500, { message: 'Internal server error' });
        });
        req.pipe(proxyReq, { end: true });
    };
    // Запуск балансировщика
    (0, http_1.createServer)(loadBalancer).listen(port, () => {
        console.log(`Load balancer running on http://localhost:${port}`);
    });
    // Обработка завершения работы воркера
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
}
else {
    const workerPort = Number(process.env.WORKER_PORT);
    if (!workerPort) {
        console.error('WORKER_PORT is not defined');
        process.exit(1);
    }
    (0, http_1.createServer)(router_1.requestHandler).listen(workerPort, () => {
        console.log(`Worker process is running on http://localhost:${workerPort}`);
    });
}
