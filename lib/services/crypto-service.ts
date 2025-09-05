import { generateRandomId } from '../../types/types.ts';
import { encryptNoteContent } from '../encryption.ts';
import { generateDeterministicClientHash } from '../hashing.ts';

export async function prepareEncryption(content: string, password?: string) {
	const hasPassword = password && password.trim() !== '';
	const authKey = !hasPassword ? generateRandomId(8) : undefined;
	const encryptionKey = password || authKey;

	if (!encryptionKey) {
		throw new Error('No password or auth token provided');
	}

	const passwordHash = hasPassword ? await generateDeterministicClientHash(password) : undefined;

	const encryptedContent = await encryptNoteContent(content, encryptionKey);

	return { encryptedContent, passwordHash, authKey };
}
