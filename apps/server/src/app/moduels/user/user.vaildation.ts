import { z } from 'zod';
import { IsActive, Role } from './user.interface.js';

// Reusable field schemas
const nameSchema = z
    .string({ error: 'Name must be a string.' })
    .min(2, { message: 'Name is too short.' })
    .max(50, { message: 'Name is too long.' });

const emailSchema = z
    .string({ error: 'Email must be a string.' })
    .email({ message: 'Invalid email address format.' })
    .min(5, { message: 'Email must be at least 5 characters long.' })
    .max(100, { message: 'Email is too long.' });

const passwordSchema = z
    .string({ error: 'Password must be a string.' })
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Must include at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Must include at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Must include at least one number.' })
    .regex(/[@$!%*?&]/, {
        message: 'Must include at least one special character.',
    });

const phoneSchema = z
    .string({ error: 'Phone must be a string.' })
    .regex(/^(?:\+88|88)?01[3-9]\d{8}$/, {
        message:
            'Only valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX.',
    });

const roleSchema = z.enum(Object.values(Role) as [string], {
    message: 'Invalid role value.',
});

const isActiveSchema = z.enum(Object.values(IsActive) as [string], {
    message: 'Invalid isActive value.',
});

const isDeletedSchema = z
    .boolean({
        error: 'isDeleted must be true or false',
    })
    .optional();

// --- Create User Validation ---
export const createUserZodSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
    picture: z
        .string({ error: 'Picture must be a string.' })
        .url({ message: 'Picture must be a valid URL.' })
        .optional(),
});

// --- Update User Validation (self-update, no role/status changes) ---
export const updateUserZodSchema = z.object({
    name: nameSchema.optional(),
    password: passwordSchema.optional(),
    phone: phoneSchema.optional(),
    picture: z
        .string({ error: 'Picture must be a string.' })
        .url({ message: 'Picture must be a valid URL.' })
        .optional(),
    role: roleSchema.optional(),
    isActive: isActiveSchema.optional(),
    isDeleted: isDeletedSchema.optional(),
});

export const UserValidation = {
    createUserValidationSchema: createUserZodSchema,
    updateUserValidationSchema: updateUserZodSchema,
};
