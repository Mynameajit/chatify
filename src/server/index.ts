import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

const app = new Hono().basePath('/api');

// Global Middlewares
app.use('*', secureHeaders());
app.use('*', cors());

// Basic Route for testing
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

import authRoutes from './modules/auth/routes';
import userRoutes from './modules/users/routes';
import friendRoutes from './modules/friends/routes';
import conversationRoutes from './modules/conversations/routes';
import messageRoutes from './modules/messages/routes';
import uploadRoutes from './modules/uploads/routes';
import callRoutes from './modules/calls/routes';

// TODO: Import and attach module routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/friends', friendRoutes);
app.route('/conversations', conversationRoutes);
app.route('/messages', messageRoutes);
app.route('/uploads', uploadRoutes);
app.route('/calls', callRoutes);

export default app;
