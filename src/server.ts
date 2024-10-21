import { createServer } from 'http';
import { requestHandler } from './router';
import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT) || 4000;

createServer(requestHandler).listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
