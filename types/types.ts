export interface Note {
	id: string;
	content: string;

	iv: string; // Initialization vector for encryption
	expiresAt: Date;

	// Optional fields for additional functionality
	password?: string; // password hash for private notes
	manualDeletion?: boolean; // Flag for manual deletion
}

const expirationMap: Record<string, number> = {
	'10m': 10 * 60 * 1000,
	'1h': 60 * 60 * 1000,
	'6h': 6 * 60 * 60 * 1000,
	'12h': 12 * 60 * 60 * 1000,
	'24h': 24 * 60 * 60 * 1000,
	'3d': 3 * 24 * 60 * 60 * 1000,
	'7d': 7 * 24 * 60 * 60 * 1000,
	'30d': 30 * 24 * 60 * 60 * 1000,
};

export function formatExpiration(expiresIn: string): Date {
	const now = new Date();

	// Validate input and use default if invalid
	if (typeof expiresIn !== 'string' || !expirationMap[expiresIn]) {
		expiresIn = '24h';
	}

	const ms = expirationMap[expiresIn];
	return new Date(now.getTime() + ms);
}

export function generateRandomId(length: number = 16): string {
	// Use crypto.getRandomValues for cryptographically secure random IDs
	const array = new Uint8Array(Math.ceil(length * 3 / 4));
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array))
		.replace(/[+/]/g, (c) => c === '+' ? '-' : '_')
		.replace(/=/g, '')
		.substring(0, length);
}
