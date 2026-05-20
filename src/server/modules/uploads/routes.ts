import { Hono } from 'hono';
import { UploadController } from './controller';
import { authMiddleware } from '@/server/middlewares/auth';

const uploadRoutes = new Hono();

uploadRoutes.use('*', authMiddleware);

uploadRoutes.post('/:type', UploadController.upload);

export default uploadRoutes;
