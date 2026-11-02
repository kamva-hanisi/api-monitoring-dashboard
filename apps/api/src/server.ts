import { app } from './index.js';
import { PrismaClient } from '@prisma/client';
const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => console.log(`API ready at http://localhost:${port}`));
process.on('SIGTERM', () => server.close(() => new PrismaClient().$disconnect()));
