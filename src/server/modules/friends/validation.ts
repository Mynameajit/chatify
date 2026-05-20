import { z } from 'zod';

export const friendRequestSchema = z.object({
  receiverId: z.string().uuid('Invalid user ID'),
});

export const friendActionSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
});

export const removeFriendSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
});
