export interface Note {
    id: string;
    content: string;

    iv: string; // Initialization vector for encryption
    expiresIn: Date;

    // Optional fields for additional functionality
    password?: string; // bcrypt'd deterministic hash of the password (password-protected notes)
    authKeyHash?: string; // bcrypt'd deterministic hash of the auth key (passwordless notes with link-possession gate)
    manualDeletion?: boolean; // Flag for manual deletion
}

// Content/password size limits. Defined here (not in validation, which pulls
// in valibot) so dependency-free consumers like the CLI can enforce them
// without loading the validation schema.
// Deno KV has a hard 64 KiB (65,536 byte) max value size. The stored value is
// the JSON-serialized note, whose content field is base64 ciphertext (~4/3
// expansion of the plaintext) plus IV, expiration, and password fields. Cap
// the plaintext so the serialized note always fits with margin. A larger cap
// would pass validation but fail at kv.set() with "Value too large".
export const NOTE_CONTENT_MAX_LENGTH = 46 * 1024; // ~46 KiB plaintext
export const NOTE_PASSWORD_MAX_LENGTH = 256; // 256 characters

// Deno KV stores the whole Note value, so map every accepted expiry label to
// a duration. The API schema (v.enum over EXPIRY_OPTIONS) validates the
// human-readable labels the web client sends ("10 minutes"), but older
// clients and the CLI may send short codes ("10m"), so both forms resolve.
const expirationMap: Record<string, number> = {
    '10m': 10 * 60 * 1000,
    '10 minutes': 10 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1 hour': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '6 hours': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '12 hours': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '24 hours': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '3 days': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '7 days': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '30 days': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '90 days': 90 * 24 * 60 * 60 * 1000,
    '180d': 180 * 24 * 60 * 60 * 1000,
    '180 days': 180 * 24 * 60 * 60 * 1000,
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
