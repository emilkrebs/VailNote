/**
 * Generates an HMAC SHA-256 hash of the given input using the provided secret key.
 * @param input - The input string to be hashed.
 * @param secret - The secret key used for hashing.
 * @returns A promise that resolves to the base64-encoded HMAC SHA-256 hash.
 * @example
 * const hash = await generateHMACSHA256('myInput', Deno.env.get('ARC_SECRET')!);
 * console.log(hash); // Outputs the HMAC SHA-256 hash in base64 format
 */
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
