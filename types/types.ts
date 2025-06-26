export interface Note {
	id: string;
	content: string;

	iv: string; // Initialization vector for encryption
	expiresAt: Date;
	password?: string; // Optional password hash for private notes
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
	const ms = expirationMap[expiresIn] ?? expirationMap['24h'];
	return new Date(now.getTime() + ms);
}

export function generateRandomId(length: number = 16): string {
	return Math.random().toString(36).substring(2, length + 2);
}
