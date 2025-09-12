import { generateRandomId } from '../types.ts';
import { encryptNoteContent } from '../encryption.ts';
import { generateDeterministicClientHash } from '../hashing.ts';

/**
 * Prepares the encryption of a note by generating the necessary keys and hashes.
 * Always generates an auth key for URL-based access. When password is provided,
 * combines both auth key and password for enhanced security.
 * @param content The content of the note to encrypt.
 * @param password An optional password for encrypting the note.
 * @returns An object containing the encrypted content, password hash, auth key, and auth key hash.
 */
export async function prepareEncryption(content: string, password?: string) {
    // Always generate an auth key for URL-based access
    const authKey = generateRandomId(8);
    
    const hasPassword = password && password.trim() !== '';
    
    // Create encryption key: combine auth key and password if both present
    let encryptionKey: string;
    if (hasPassword) {
        // Combine auth key and password for enhanced security
        encryptionKey = `${authKey}:${password}`;
    } else {
        // Use only auth key when no password provided
        encryptionKey = authKey;
    }

    // Generate hashes for server-side verification
    const passwordHash = hasPassword ? await generateDeterministicClientHash(password) : undefined;
    const authKeyHash = await generateDeterministicClientHash(authKey);

    const encryptedContent = await encryptNoteContent(content, encryptionKey);

    return { encryptedContent, passwordHash, authKey, authKeyHash };
}

/**
 * Creates the decryption key from auth key and password.
 * Matches the logic used in prepareEncryption.
 * @param authKey The auth key from the URL
 * @param password Optional password provided by user
 * @returns The combined decryption key
 */
export function createDecryptionKey(authKey: string, password?: string): string {
    if (password && password.trim() !== '') {
        return `${authKey}:${password}`;
    }
    return authKey;
}
