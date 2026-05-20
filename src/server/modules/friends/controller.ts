import { Context } from 'hono';
import { FriendService } from './service';
import { friendRequestSchema, friendActionSchema, removeFriendSchema } from './validation';
import { ZodError } from 'zod';

export class FriendController {
  static async sendRequest(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { receiverId } = friendRequestSchema.parse(body);

      const request = await FriendService.sendRequest(userId, receiverId);
      return c.json({ success: true, data: request }, 201);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async acceptRequest(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { requestId } = friendActionSchema.parse(body);

      const friendship = await FriendService.acceptRequest(userId, requestId);
      return c.json({ success: true, data: friendship }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async rejectRequest(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { requestId } = friendActionSchema.parse(body);

      await FriendService.rejectRequest(userId, requestId);
      return c.json({ success: true, message: 'Request rejected' }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async cancelRequest(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { requestId } = friendActionSchema.parse(body);

      await FriendService.cancelRequest(userId, requestId);
      return c.json({ success: true, message: 'Request cancelled' }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async removeFriend(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { friendId } = removeFriendSchema.parse(body);

      await FriendService.removeFriend(userId, friendId);
      return c.json({ success: true, message: 'Friend removed' }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async getList(c: Context) {
    try {
      const userId = c.get('userId');
      const friends = await FriendService.getFriendList(userId);
      return c.json({ success: true, data: friends }, 200);
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async getNotifications(c: Context) {
    try {
      const userId = c.get('userId');
      const notifications = await FriendService.getNotifications(userId);
      return c.json({ success: true, data: notifications }, 200);
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async markNotificationsRead(c: Context) {
    try {
      const userId = c.get('userId');
      await FriendService.markNotificationsRead(userId);
      return c.json({ success: true, message: 'Notifications marked as read' }, 200);
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }
}
