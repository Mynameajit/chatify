import { Hono } from 'hono';
import { FriendController } from './controller';
import { authMiddleware } from '@/server/middlewares/auth';

const friendRoutes = new Hono();

friendRoutes.use('*', authMiddleware);

friendRoutes.post('/request', FriendController.sendRequest);
friendRoutes.post('/accept', FriendController.acceptRequest);
friendRoutes.post('/reject', FriendController.rejectRequest);
friendRoutes.post('/cancel', FriendController.cancelRequest);
friendRoutes.delete('/remove', FriendController.removeFriend);
friendRoutes.get('/list', FriendController.getList);
friendRoutes.get('/notifications', FriendController.getNotifications);
friendRoutes.post('/notifications/read', FriendController.markNotificationsRead);

export default friendRoutes;
