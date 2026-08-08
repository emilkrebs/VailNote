export interface Note {
    id: string;
    content: string;

    iv: string; // Initialization vector for encryption
    expiresIn: Date;

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

export function formatExpirationMessage(expiresIn: Date): string {
    const now = new Date();
    expiresIn = new Date(expiresIn);
    const diff = expiresIn.getTime() - now.getTime();

    if (diff <= 0) {
        return 'Expired';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;

    // Always show the largest unit only, so the countdown follows one
    // visible rule as it ticks down: "3 days" -> "2 hours" -> "1 minute".
    const units: Array<[string, number]> = [
        ['day', days],
        ['hour', hours],
        ['minute', minutes],
        ['second', seconds],
    ];
    const largest = units.find((unit) => unit[1] > 0);

    if (largest === undefined) {
        return 'Just now';
    }

    const [unit, value] = largest;
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
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
