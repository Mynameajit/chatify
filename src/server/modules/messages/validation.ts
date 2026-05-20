import { z } from 'zod';

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'VOICE', 'DOCUMENT', 'SYSTEM']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    size: z.number().optional(),
    name: z.string().optional(),
  })).optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
});

export const deleteMessageSchema = z.object({
  forEveryone: z.boolean().default(false),
});

export const seenMessageSchema = z.object({
  conversationId: z.string().uuid(),
});
