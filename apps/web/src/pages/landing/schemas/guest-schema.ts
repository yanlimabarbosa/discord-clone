import { z } from 'zod';

export const guestSchema = z.object({
  displayName: z
    .string()
    .min(2, 'At least 2 characters')
    .max(32, 'At most 32 characters'),
});

export type GuestFormData = z.infer<typeof guestSchema>;
