import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().min(2, 'At least 2 characters').max(32),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(24)
    .regex(/^[a-z0-9_.]+$/i, 'Letters, numbers, _ and . only'),
  password: z.string().min(6, 'At least 6 characters'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
