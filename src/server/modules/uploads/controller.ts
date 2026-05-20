import { Context } from 'hono';
import { UploadService } from './service';

export class UploadController {
  static async upload(c: Context) {
    try {
      const body = await c.req.parseBody();
      const file = body['file'] as File;

      if (!file) {
        return c.json({ success: false, message: 'No file provided' }, 400);
      }

      // Check file size (e.g. max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return c.json({ success: false, message: 'File too large (max 10MB)' }, 400);
      }

      const type = c.req.param('type'); // image, video, document
      const result: any = await UploadService.uploadFile(file, `chat-app/${type}s`);

      return c.json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          type: result.resource_type,
        }
      }, 200);

    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }
}
