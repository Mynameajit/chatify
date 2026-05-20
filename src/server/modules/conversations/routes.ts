import { Hono } from 'hono';
import { ConversationController } from './controller';
import { authMiddleware } from '@/server/middlewares/auth';

const conversationRoutes = new Hono();

conversationRoutes.use('*', authMiddleware);

conversationRoutes.get('/', ConversationController.getConversations);
conversationRoutes.post('/create', ConversationController.createConversation);

export default conversationRoutes;
