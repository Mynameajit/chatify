import { Hono } from 'hono';
import { AuthController } from './controller';

const authRoutes = new Hono();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/logout', AuthController.logout);

export default authRoutes;
