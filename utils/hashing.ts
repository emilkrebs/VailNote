import * as bcrypt from 'bcrypt';

export function generateHash(password: string): string {
	const salt = bcrypt.genSaltSync(8);
	return bcrypt.hashSync(password, salt);
}

export async function generateSHA256Hash(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	// Convert ArrayBuffer to base64 string
	return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

/** * Compares a plain text password with a hashed password.
 * @param password The plain text password
 * @param hash The hashed password to compare against
 * @returns true if the password matches the hash, false otherwise
 */
export function compareHash(
	password: string,
	hash: string,
): boolean {
	return bcrypt.compareSync(password, hash);
}
