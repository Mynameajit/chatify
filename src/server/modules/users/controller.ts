import { Context } from 'hono';
import { UserService } from './service';
import { updateProfileSchema, changePasswordSchema } from './validation';
import { ZodError } from 'zod';

export class UserController {
  static async getMe(c: Context) {
    try {
      const userId = c.get('userId');
      const user = await UserService.getProfile(userId);
      return c.json({ success: true, data: user });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 404);
    }
  }

  static async updateProfile(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const data = updateProfileSchema.parse(body);

      const user = await UserService.updateProfile(userId, data);
      return c.json({ success: true, data: user });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ success: false, message: error.errors[0].message }, 400);
      }
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async searchUsers(c: Context) {
    try {
      const userId = c.get('userId');
      const query = c.req.query('q') || '';
      
      const users = await UserService.searchUsers(query, userId);
      return c.json({ success: true, data: users });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async getUserProfile(c: Context) {
    try {
      const id = c.req.param('id') || '';
      const currentUserId = c.get('userId'); // Optional or required depending on route auth
      const user = await UserService.getProfile(id, currentUserId);
      return c.json({ success: true, data: user });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 404);
    }
  }

  static async blockUser(c: Context) {
    try {
      const currentUserId = c.get('userId');
      const { userId } = await c.req.json();
      if (!userId) throw new Error("userId to block is required");
      const result = await UserService.blockUser(currentUserId, userId);
      return c.json({ success: true, data: result });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async unblockUser(c: Context) {
    try {
      const currentUserId = c.get('userId');
      const { userId } = await c.req.json();
      if (!userId) throw new Error("userId to unblock is required");
      const result = await UserService.unblockUser(currentUserId, userId);
      return c.json({ success: true, data: result });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async changePassword(c: Context) {
    try {
      const currentUserId = c.get('userId');
      const body = await c.req.json();
      const data = changePasswordSchema.parse(body);

      const result = await UserService.changePassword(currentUserId, data.currentPassword, data.newPassword);
      return c.json({ success: true, data: result });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ success: false, message: error.errors[0].message }, 400);
      }
      return c.json({ success: false, message: error.message }, 400);
    }
  }
}
