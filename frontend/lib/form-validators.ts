import { z } from 'zod';

/** Valid HTTP(S) URL */
export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .url('Enter a valid URL (e.g. https://example.com)');

/** Vault name */
export const vaultNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or fewer');

/** Vault description (optional) */
export const vaultDescriptionSchema = z
  .string()
  .max(500, 'Description must be 500 characters or fewer')
  .optional()
  .or(z.literal(''));

/** Source title (optional) */
export const sourceTitleSchema = z
  .string()
  .max(200, 'Title must be 200 characters or fewer')
  .optional()
  .or(z.literal(''));

/** Annotation content */
export const annotationContentSchema = z
  .string()
  .min(1, 'Annotation cannot be empty')
  .max(5000, 'Annotation must be 5 000 characters or fewer');

/** Email */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

/* ── Composite schemas ── */

export const addSourceSchema = z.object({
  url: urlSchema,
  title: sourceTitleSchema,
});
export type AddSourceFormValues = z.infer<typeof addSourceSchema>;

export const editSourceSchema = z.object({
  url: urlSchema,
  title: sourceTitleSchema,
});
export type EditSourceFormValues = z.infer<typeof editSourceSchema>;

export const createVaultSchema = z.object({
  name: vaultNameSchema,
  description: vaultDescriptionSchema,
});
export type CreateVaultFormValues = z.infer<typeof createVaultSchema>;

export const editVaultSchema = z.object({
  name: vaultNameSchema,
  description: vaultDescriptionSchema,
});
export type EditVaultFormValues = z.infer<typeof editVaultSchema>;

export const addAnnotationSchema = z.object({
  content: annotationContentSchema,
});
export type AddAnnotationFormValues = z.infer<typeof addAnnotationSchema>;

export const addMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['contributor', 'viewer']),
});
export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
