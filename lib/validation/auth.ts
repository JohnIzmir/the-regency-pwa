import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[0-9]/, 'Include at least one number.');

export const SignUpSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name.').max(100),
    email: z.string().trim().email('Enter a valid email address.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });
export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
export type SignInInput = z.infer<typeof SignInSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;

export const UpdatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
