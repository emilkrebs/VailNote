import { generateRandomId } from '../types.ts';
import { encryptNoteContent } from '../encryption.ts';
import { generateDeterministicClientHash } from '../hashing.ts';

/**
 * Combines a password with an auth key into a single secret used for key derivation.
 * Both factors are required to decrypt password-protected notes.
 */
export function combineNoteSecrets(password: string, authKey: string): string {
    return `${password}:${authKey}`;
}

/**
 * Prepares the encryption of a note by generating the necessary keys and hashes.
 *
 * An auth key is always generated and embedded in the note link. Without a password
 * it is the sole encryption secret; with a password both are combined, so neither
 * the link alone nor the password alone can decrypt the note.
 * @param content The content of the note to encrypt.
 * @param password An optional password for encrypting the note.
 * @returns An object containing the encrypted content, password hash, and auth key.
 */
export async function prepareEncryption(content: string, password?: string) {
    const hasPassword = !!password && password.trim() !== '';
    const authKey = generateRandomId(8);
    const encryptionKey = hasPassword ? combineNoteSecrets(password, authKey) : authKey;

    const passwordHash = hasPassword ? await generateDeterministicClientHash(password) : undefined;

    const encryptedContent = await encryptNoteContent(content, encryptionKey);

    return { encryptedContent, passwordHash, authKey };
}
