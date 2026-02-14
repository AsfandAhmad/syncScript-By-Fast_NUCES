import { z } from 'zod';

// Vault schemas
export const createVaultSchema = z.object({
  name: z
    .string()
    .min(1, 'Vault name is required')
    .max(100, 'Vault name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

export const updateVaultSchema = createVaultSchema.partial();

// Source schemas
export const createSourceSchema = z.object({
  title: z
    .string()
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  url: z
    .string()
    .url('Please enter a valid URL')
    .or(z.literal(''))
    .optional(),
}).refine(
  (data) => (data.title && data.title.trim()) || (data.url && data.url.trim()),
  { message: 'Either a title or URL is required' }
);

// Annotation schemas
export const createAnnotationSchema = z.object({
  content: z
    .string()
    .min(1, 'Annotation content is required')
    .max(5000, 'Annotation must be 5000 characters or less')
    .trim(),
});

export const updateAnnotationSchema = createAnnotationSchema;

// Member schemas
export const addMemberSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  role: z.enum(['contributor', 'viewer'], {
    required_error: 'Please select a role',
  }),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be 72 characters or less'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Type exports
export type CreateVaultInput = z.infer<typeof createVaultSchema>;
export type UpdateVaultInput = z.infer<typeof updateVaultSchema>;
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type CreateAnnotationInput = z.infer<typeof createAnnotationSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
