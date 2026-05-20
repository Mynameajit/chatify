import { Context } from 'hono';
import { AuthService } from './service';
import { registerSchema, loginSchema } from './validation';
import { ZodError } from 'zod';

export class AuthController {
  static async register(c: Context) {
    try {
      const body = await c.req.json();
      const data = registerSchema.parse(body);

      const result = await AuthService.register(data);

      return c.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
          token: result.token,
        },
      }, 201);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ success: false, message: error.errors[0].message }, 400);
      }
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async login(c: Context) {
    try {
      const body = await c.req.json();
      const data = loginSchema.parse(body);

      const result = await AuthService.login(data);

      return c.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
          token: result.token,
        },
      }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ success: false, message: error.errors[0].message }, 400);
      }
      return c.json({ success: false, message: error.message }, 401);
    }
  }

  static async logout(c: Context) {
    // In a stateless JWT setup, logout is usually handled client-side by dropping the token.
    // We can also blacklist the token in Redis if needed.
    return c.json({ success: true, message: 'Logged out successfully' }, 200);
  }
}



