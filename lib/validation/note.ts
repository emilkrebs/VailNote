import * as v from '@valibot/valibot';

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

// Deno KV has a hard 64 KiB (65,536 byte) max value size. The stored value is
// the JSON-serialized note, whose content field is base64 ciphertext (~4/3
// expansion of the plaintext) plus IV, expiration, and password fields. Cap
// the plaintext so the serialized note always fits with margin. A larger cap
// would pass validation but fail at kv.set() with "Value too large".
export const NOTE_CONTENT_MAX_LENGTH = 46 * 1024; // ~46 KiB plaintext
export const NOTE_PASSWORD_MAX_LENGTH = 256; // 256 characters

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
