import { assertEquals, assertExists } from '$std/assert/mod.ts';
import { prepareEncryption, createDecryptionKey } from '../lib/services/crypto-service.ts';
import { decryptNoteContent } from '../lib/encryption.ts';

Deno.test({
    name: 'Crypto Service - Combined auth key and password',
    fn: async (t) => {
        const testContent = 'This is a test note for combined authentication.';
        const testPassword = 'testpassword123';

        await t.step('should always generate auth key', async () => {
            // Test without password
            const resultNoPassword = await prepareEncryption(testContent);
            assertExists(resultNoPassword.authKey, 'Auth key should be generated even without password');
            assertExists(resultNoPassword.authKeyHash, 'Auth key hash should be generated');
            assertEquals(resultNoPassword.passwordHash, undefined, 'Password hash should be undefined when no password');

            // Test with password
            const resultWithPassword = await prepareEncryption(testContent, testPassword);
            assertExists(resultWithPassword.authKey, 'Auth key should be generated with password');
            assertExists(resultWithPassword.authKeyHash, 'Auth key hash should be generated');
            assertExists(resultWithPassword.passwordHash, 'Password hash should be generated when password provided');
        });

        await t.step('should create correct decryption key', () => {
            const authKey = 'testAuthKey123';
            
            // Without password
            const keyNoPassword = createDecryptionKey(authKey);
            assertEquals(keyNoPassword, authKey, 'Decryption key should be just auth key when no password');

            // With password
            const keyWithPassword = createDecryptionKey(authKey, testPassword);
            assertEquals(keyWithPassword, `${authKey}:${testPassword}`, 'Decryption key should combine auth key and password');
        });

        await t.step('should encrypt and decrypt correctly with combined key', async () => {
            const { encryptedContent, authKey } = await prepareEncryption(testContent, testPassword);
            assertExists(authKey, 'Auth key should be generated');

            // Decrypt using combined key
            const decryptionKey = createDecryptionKey(authKey, testPassword);
            const decryptedContent = await decryptNoteContent(
                encryptedContent.encrypted,
                encryptedContent.iv,
                decryptionKey
            );

            assertEquals(decryptedContent, testContent, 'Decrypted content should match original');
        });

        await t.step('should encrypt and decrypt correctly with auth key only', async () => {
            const { encryptedContent, authKey } = await prepareEncryption(testContent);
            assertExists(authKey, 'Auth key should be generated');

            // Decrypt using auth key only
            const decryptionKey = createDecryptionKey(authKey);
            const decryptedContent = await decryptNoteContent(
                encryptedContent.encrypted,
                encryptedContent.iv,
                decryptionKey
            );

            assertEquals(decryptedContent, testContent, 'Decrypted content should match original');
        });
    },
    sanitizeResources: false,
    sanitizeOps: false,
});