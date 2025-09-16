export async function generateSHA256Hash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    // Convert ArrayBuffer to base64 string
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

export async function generateHMACSHA256(input: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(input));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Client-side secure password hashing using PBKDF2 (alternative to bcrypt for browsers)
 * This provides similar security to bcrypt but works in web browsers
 * @param password The plain text password to hash
 * @param salt Optional salt (will generate random salt if not provided)
 * @param iterations Number of iterations (default: 600000 for security)
 * @returns Base64 encoded hash with salt prepended
 */
export async function generateClientHash(password: string, salt?: string, iterations = 600000): Promise<string> {
    const encoder = new TextEncoder();

    // Generate random salt if not provided
    const saltBytes = salt ? encoder.encode(salt) : crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = btoa(String.fromCharCode(...saltBytes));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );

    // Derive key using PBKDF2
    const derivedKey = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        256, // 32 bytes
    );

    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedKey)));

    // Return salt + hash combined (similar to bcrypt format)
    return `pbkdf2:${iterations}:${saltBase64}:${hashBase64}`;
}

/**
 * Verify a password against a client-side PBKDF2 hash
 * @param password The plain text password to verify
 * @param hash The stored hash (format: pbkdf2:iterations:salt:hash)
 * @returns True if password matches, false otherwise
 */
export async function verifyClientHash(password: string, hash: string): Promise<boolean> {
    try {
        const [algorithm, iterations, saltBase64, storedHashBase64] = hash.split(':');

        if (algorithm !== 'pbkdf2') {
            throw new Error('Unsupported hash algorithm');
        }

        const saltBytes = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
        const computedHash = await generateClientHash(
            password,
            new TextDecoder().decode(saltBytes),
            parseInt(iterations),
        );

        // Extract just the hash part for comparison
        const [, , , computedHashBase64] = computedHash.split(':');

        return computedHashBase64 === storedHashBase64;
    } catch (error) {
        console.error('Error verifying client hash:', error);
        return false;
    }
}

/**
 * Client-side deterministic password hashing using PBKDF2 with password-derived salt
 * This ensures the same password always produces the same hash
 * @param password The plain text password to hash
 * @param iterations Number of iterations (default: 600000 for security)
 * @returns Base64 encoded hash that's deterministic for the same password
 */
export async function generateDeterministicClientHash(password: string, iterations = 600000): Promise<string> {
    const encoder = new TextEncoder();

    // Use SHA-256 of password as deterministic salt (this ensures same password = same salt)
    const saltBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password + 'vailnote_salt'));
    const saltBytes = new Uint8Array(saltBuffer);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );

    // Derive key using PBKDF2
    const derivedKey = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        256, // 32 bytes
    );

    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedKey)));

    // Return just the hash (deterministic)
    return hashBase64;
}
