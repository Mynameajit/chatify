import { Hono } from 'hono';
import { CallController } from './controller';
import { authMiddleware } from '@/server/middlewares/auth';

const callRoutes = new Hono();

callRoutes.use('*', authMiddleware);

callRoutes.post('/start', CallController.startCall);
callRoutes.post('/end', CallController.endCall);

export default callRoutes;
