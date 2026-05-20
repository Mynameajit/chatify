import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  profilePhoto: z.string().url('Invalid URL').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
