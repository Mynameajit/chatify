import { z } from 'zod';

export const startCallSchema = z.object({
  receiverId: z.string().uuid(),
  isVideo: z.boolean().default(false),
});

export const endCallSchema = z.object({
  callId: z.string().uuid(),
  status: z.enum(['MISSED', 'ANSWERED', 'REJECTED']),
  duration: z.number().optional(), // in seconds
});
