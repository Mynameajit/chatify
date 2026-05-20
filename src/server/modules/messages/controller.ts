import { Context } from 'hono';
import { MessageService } from './service';
import { sendMessageSchema, editMessageSchema, deleteMessageSchema, seenMessageSchema } from './validation';
import { ZodError } from 'zod';

export class MessageController {
  static async getMessages(c: Context) {
    try {
      const userId = c.get('userId');
      const conversationId = c.req.param('conversationId') || '';
      const cursor = c.req.query('cursor');

      const data = await MessageService.getMessages(conversationId, userId, cursor);
      return c.json({ success: true, data }, 200);
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async sendMessage(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const data = sendMessageSchema.parse(body);

      const message = await MessageService.sendMessage(userId, data);
      
      // In a real implementation, we would emit socket event here or from the socket handler directly
      // io.to(`conversation:${data.conversationId}`).emit('message:new', message);

      return c.json({ success: true, data: message }, 201);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async editMessage(c: Context) {
    try {
      const userId = c.get('userId');
      const messageId = c.req.param('id') || '';
      const body = await c.req.json();
      const data = editMessageSchema.parse(body);

      const message = await MessageService.editMessage(userId, messageId, data);
      return c.json({ success: true, data: message }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async deleteMessage(c: Context) {
    try {
      const userId = c.get('userId');
      const messageId = c.req.param('id') || '';
      const body = await c.req.json().catch(() => ({})); // Might be empty body
      const data = deleteMessageSchema.parse(body);

      const result = await MessageService.deleteMessage(userId, messageId, data.forEveryone);
      return c.json({ success: true, data: result }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async markSeen(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const { conversationId } = seenMessageSchema.parse(body);

      const result = await MessageService.markSeen(userId, conversationId);
      return c.json({ success: true, data: result }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }
}
