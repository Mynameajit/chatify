import { Hono } from 'hono';
import { UserController } from './controller';
import { authMiddleware } from '@/server/middlewares/auth';

const userRoutes = new Hono();

userRoutes.use('*', authMiddleware);

userRoutes.get('/me', UserController.getMe);
userRoutes.patch('/profile', UserController.updateProfile);
userRoutes.get('/search', UserController.searchUsers);
userRoutes.get('/:id', UserController.getUserProfile);

export default userRoutes;
