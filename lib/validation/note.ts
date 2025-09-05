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
}

export enum MANUAL_DELETION_OPTIONS {
	'disabled' = 'Disable Manual Deletion',
	'enabled' = 'Enable Manual Deletion',
}

export const NOTE_CONTENT_MAX_LENGTH = 1024 * 1024; // 1 MB
export const NOTE_PASSWORD_MAX_LENGTH = 256; // 256 characters

export const createNoteSchema = v.object({
	content: v.pipe(
		v.string(),
		v.minLength(1, 'Note content is required'),
		v.maxLength(NOTE_CONTENT_MAX_LENGTH, 'Note content is too long (max 1MB)'),
		v.trim(),
	),
	password: v.optional(
		v.pipe(v.string(), v.maxLength(NOTE_PASSWORD_MAX_LENGTH, 'Password is too long (max 256 characters)'), v.trim()),
	), // Optional password with max length
	expiresIn: v.enum(EXPIRY_OPTIONS, 'Invalid expiration time. Please select a valid option.'),
	manualDeletion: v.union([v.optional(v.enum(MANUAL_DELETION_OPTIONS)), v.boolean()], 'Wrong manual deletion value'), // Allow empty string for default value
});

export const viewNoteSchema = v.object({
	password: v.string(),
});

export type CreateNoteSchema = v.InferOutput<typeof createNoteSchema>;
export type ViewNoteSchema = v.InferOutput<typeof viewNoteSchema>;

export const expirationOptions: string[] = Object.values(EXPIRY_OPTIONS);
export const manualDeletionOptions: string[] = Object.values(MANUAL_DELETION_OPTIONS);
