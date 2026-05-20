import { z } from 'zod';

export const createConversationSchema = z.object({
  isGroup: z.boolean().default(false),
  participantIds: z.array(z.string().uuid()).min(1, 'At least one participant required'),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});
