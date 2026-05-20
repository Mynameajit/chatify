import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const parseCookies = (cookieString?: string): Record<string, string> => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((res, c) => {
    const [key, val] = c.trim().split('=');
    if (key && val) res[key] = decodeURIComponent(val);
    return res;
  }, {} as Record<string, string>);
};

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const cookies = parseCookies(socket.handshake.headers?.cookie);
  const token = socket.handshake.auth?.token || 
                socket.handshake.headers?.authorization?.split(' ')[1] || 
                cookies['token'];

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};
