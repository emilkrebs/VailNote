export class AESEncryption {
    private _cryptoKey?: CryptoKey;
    private _key?: string;
    private _encoder = new TextEncoder();
    private _decoder = new TextDecoder();

    async setup(key: string) {
        this._cryptoKey = await getAESEncryptionKey(key);
        this._key = key;
    }

    // check if encryption is setup and contains a key and iv
    isSetup(): boolean {
        return !!this._cryptoKey;
    }

    // get the encryption key and iv
    getEncryptionKey(): string {
        this.checkSetup();
        return this._key!;
    }

    /**
     * Encrypt a string using the provided encryption key and iv
     */
    async encrypt(data: string, iv: string): Promise<string> {
        this.checkSetup();
        const dataBytes = this._encoder.encode(data);
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(base64ToUint8Array(iv)).buffer,
            },
            this._cryptoKey!,
            dataBytes,
        );
        return uint8ArrayToBase64(new Uint8Array(encryptedData));
    }

    /**
     * Decrypt a string using the provided encryption key and iv
     */
    async decrypt(data: string, iv: string): Promise<string> {
        this.checkSetup();
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(base64ToUint8Array(iv)).buffer,
            },
            this._cryptoKey!,
            new Uint8Array(base64ToUint8Array(data)),
        );
        return this._decoder.decode(new Uint8Array(decryptedData));
    }

    private checkSetup() {
        if (!this.isSetup()) {
            throw new Error('Encryption not setup');
        }
    }
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    const CHUNK_SIZE = 0x8000; // 32 KB chunks stay well under the argument-count limit
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(i, i + CHUNK_SIZE);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binaryString);
}

// Convert a Base64-encoded string back to a Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
}

export function compressURIComponent(str: string): string {
    // compress the string
    return uint8ArrayToBase64(new TextEncoder().encode(str));
}

export function decompressURIComponent(str: string): string {
    // decompress the string
    return new TextDecoder().decode(base64ToUint8Array(str));
}

// generate a random AES key for encryption
export function generateEncryptionKey(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
}

// generate a random AES iv for encryption
export function generateEncryptionIv(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
}

export function getAESEncryptionKey(key: string): Promise<CryptoKey> {
    const keyBytes = base64ToUint8Array(key);
    const keyBuffer = new Uint8Array(keyBytes).buffer; // ensure concrete ArrayBuffer
    return crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt'],
    );
}

export function getAESEncryptionIV(iv: string): Uint8Array {
    return base64ToUint8Array(iv);
}

// Iteration count for deriving the AES content key from the password/auth key.
// PBKDF2-SHA256 with a per-note salt (the IV) makes offline brute-force of note
// content by anyone holding the ciphertext computationally expensive.
const CONTENT_KEY_ITERATIONS = 600000;

async function deriveContentKey(secret: string, salt: Uint8Array): Promise<string> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(salt).buffer, // ensure concrete ArrayBuffer
            iterations: CONTENT_KEY_ITERATIONS,
            hash: 'SHA-256',
        },
        keyMaterial,
        256,
    );
    return uint8ArrayToBase64(new Uint8Array(derivedBits));
}

/**
 * Encrypt note content using a password
 * @param content The note content
 * @param password The password
 * @returns { encrypted: string, iv: string }
 */
export async function encryptNoteContent(
    content: string,
    password: string,
): Promise<{ encrypted: string; iv: string }> {
    // Generate a random IV (also used as the PBKDF2 salt for key derivation)
    const ivBytes = generateEncryptionIv();
    const ivBase64 = uint8ArrayToBase64(ivBytes);

    // Derive a 32-byte AES key from the password using PBKDF2 (salted with the IV)
    const keyBase64 = await deriveContentKey(password, ivBytes);

    // Encrypt the content
    const aes = new AESEncryption();
    await aes.setup(keyBase64);
    const encrypted = await aes.encrypt(content, ivBase64);

    return { encrypted, iv: ivBase64 };
}

/** * Decrypt note content using a password
 * @param encrypted The encrypted note content
 * @param iv The initialization vector used during encryption
 * @param password The password used for encryption
 * @return The decrypted note content
 */
export async function decryptNoteContent(
    encrypted: string,
    iv: string,
    password: string,
): Promise<string> {
    // Derive the 32-byte AES key from the password using PBKDF2 (salted with the IV)
    const keyBase64 = await deriveContentKey(password, base64ToUint8Array(iv));

    // Decrypt the content
    const aes = new AESEncryption();
    await aes.setup(keyBase64);
    return await aes.decrypt(encrypted, iv);
}
