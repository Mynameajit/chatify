import { Hono } from 'hono';
import { MessageController } from './controller';
import { authMiddleware } from '@/server/middlewares/auth';

const messageRoutes = new Hono();

messageRoutes.use('*', authMiddleware);

messageRoutes.get('/:conversationId', MessageController.getMessages);
messageRoutes.post('/send', MessageController.sendMessage);
messageRoutes.patch('/edit/:id', MessageController.editMessage);
messageRoutes.delete('/delete/:id', MessageController.deleteMessage);
messageRoutes.post('/seen', MessageController.markSeen);

export default messageRoutes;
