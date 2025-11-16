import { z } from 'zod';

/**
 * User-related types and schemas
 */

export const UserRoleSchema = z.enum(['customer', 'admin', 'super_admin']);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const AddressSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type Address = z.infer<typeof AddressSchema>;

export const UserPreferencesSchema = z.object({
  newsletter: z.boolean().default(false),
  notifications: z.boolean().default(true),
  currency: z.string().default('USD'),
  language: z.string().default('en'),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: UserRoleSchema.default('customer'),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  addresses: z.array(AddressSchema).default([]),
  preferences: UserPreferencesSchema.default({}),
  emailVerified: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
