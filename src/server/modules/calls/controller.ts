import { Context } from 'hono';
import { CallService } from './service';
import { startCallSchema, endCallSchema } from './validation';
import { ZodError } from 'zod';

export class CallController {
  static async startCall(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const data = startCallSchema.parse(body);

      const call = await CallService.startCall(userId, data);
      return c.json({ success: true, data: call }, 201);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }

  static async endCall(c: Context) {
    try {
      const userId = c.get('userId');
      const body = await c.req.json();
      const data = endCallSchema.parse(body);

      const call = await CallService.endCall(userId, data);
      return c.json({ success: true, data: call }, 200);
    } catch (error: any) {
      if (error instanceof ZodError) return c.json({ success: false, message: error.errors[0].message }, 400);
      return c.json({ success: false, message: error.message }, 400);
    }
  }
}
