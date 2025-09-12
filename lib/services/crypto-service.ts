import { generateRandomId } from '../../types/types.ts';
import { encryptNoteContent } from '../encryption.ts';
import { generateDeterministicClientHash } from '../hashing.ts';

/**
 * Prepares the encryption of a note by generating the necessary keys and hashes.
 * @param content The content of the note to encrypt.
 * @param password An optional password for encrypting the note.
 * @returns An object containing the encrypted content, password hash, and auth key.
 */
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
