import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const authMiddleware = async (c: Context, next: Next) => {
  let token = getCookie(c, 'token');

  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: No token provided' }, 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    c.set('userId', decoded.userId);
    await next();
  } catch (error) {
    return c.json({ success: false, message: 'Unauthorized: Invalid token' }, 401);
  }
};
