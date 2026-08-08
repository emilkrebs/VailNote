import * as v from '@valibot/valibot';
import { NOTE_CONTENT_MAX_LENGTH, NOTE_PASSWORD_MAX_LENGTH } from '../types.ts';

export enum EXPIRY_OPTIONS {
    '10m' = '10 minutes',
    '1h' = '1 hour',
    '6h' = '6 hours',
    '12h' = '12 hours',
    '24h' = '24 hours',
    '3d' = '3 days',
    '7d' = '7 days',
    '30d' = '30 days',
    '90d' = '90 days',
    '180d' = '180 days',
}

export enum MANUAL_DELETION_OPTIONS {
    'disabled' = 'Disable Manual Deletion',
    'enabled' = 'Enable Manual Deletion',
}

export const createNoteSchema = v.object({
    content: v.pipe(
        v.string(),
        v.nonEmpty('Note content is required'),
        v.maxLength(NOTE_CONTENT_MAX_LENGTH, 'Note content is too long (max 46KB)'),
    ),
    password: v.optional(
        v.pipe(
            v.string(),
            v.maxLength(NOTE_PASSWORD_MAX_LENGTH, 'Password is too long (max 256 characters)'),
        ),
    ), // Optional password with max length
    authKeyHash: v.optional(
        v.pipe(
            v.string(),
            v.maxLength(NOTE_PASSWORD_MAX_LENGTH, 'Auth key hash is too long (max 256 characters)'),
        ),
    ), // Optional deterministic hash of the auth key (enables link-possession gate)
    expiresIn: v.enum(EXPIRY_OPTIONS, 'Invalid expiration time. Please select a valid option.'),
    manualDeletion: v.union(
        [v.optional(v.enum(MANUAL_DELETION_OPTIONS)), v.boolean()],
        'Invalid manual deletion setting. Please select a valid option.',
    ), // Allow empty string for default value
});

export const viewNoteSchema = v.object({
    password: v.pipe(
        v.string(),
        v.nonEmpty('Password is required'),
        v.maxLength(NOTE_PASSWORD_MAX_LENGTH, 'Password is too long (max 256 characters)'),
    ),
});

export type CreateNoteSchema = v.InferOutput<typeof createNoteSchema>;
export type ViewNoteSchema = v.InferOutput<typeof viewNoteSchema>;

export const expirationOptions: string[] = Object.values(EXPIRY_OPTIONS);
