import { Context } from 'hono';
import { ConversationService } from './service';
import { createConversationSchema } from './validation';
import { ZodError } from 'zod';

export class ConversationController {
  static async getConversations(c: Context) {
    try {
      const userId = c.get('userId');
      const conversations = await ConversationService.getConversations(userId);
      return c.json({ success: true, data: conversations }, 200);
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async createConversation(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const data = createConversationSchema.parse(body);

      const conversation = await ConversationService.createConversation(userId, data);
      return c.json({ success: true, data: conversation }, 201);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }
}
