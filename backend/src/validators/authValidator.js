import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'email is required' })
    .email('Please provide a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string({ required_error: 'password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

export const createClientSchema = z.object({
  name: z
    .string({ required_error: 'name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'email is required' })
    .email('Please provide a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string({ required_error: 'password is required' })
    .min(6, 'Password must be at least 6 characters'),
  company: z
    .string()
    .optional()
    .default('Enterprise Client'),
});

export default {
  loginSchema,
  createClientSchema,
};
