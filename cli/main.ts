#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { decryptNoteContent } from '../lib/encryption.ts';
import { generateDeterministicClientHash } from '../lib/hashing.ts';
import { combineNoteSecrets, prepareEncryption } from '../lib/services/crypto-service.ts';
import { NOTE_CONTENT_MAX_LENGTH } from '../lib/types.ts';

export const CLI_VERSION = '1.0.0';
export const DEFAULT_ORIGIN = 'https://vailnote.com';
export const EXPIRY_OPTIONS = ['10m', '1h', '6h', '12h', '24h', '3d', '7d', '30d', '90d', '180d'] as const;
export type ExpiryOption = typeof EXPIRY_OPTIONS[number];

// The API schema validates the human-readable labels ("10 minutes"), so the
// CLI's short codes are translated before sending.
export const EXPIRY_API_VALUES: Record<ExpiryOption, string> = {
    '10m': '10 minutes',
    '1h': '1 hour',
    '6h': '6 hours',
    '12h': '12 hours',
    '24h': '24 hours',
    '3d': '3 days',
    '7d': '7 days',
    '30d': '30 days',
    '90d': '90 days',
    '180d': '180 days',
};

export interface CliOptions {
    command: string;
    positional: string[];
    password?: string;
    expiresIn: ExpiryOption;
    manualDeletion: boolean;
    origin: string;
    json: boolean;
}

export interface CreateResult {
    noteId: string;
    authKey: string;
    link: string;
    expiresIn: ExpiryOption;
}

export interface ReadResult {
    id: string;
    content: string;
    expiresIn: string;
    manualDeletion?: boolean;
}

export class CliError extends Error {}

const USAGE = `VailNote CLI - create, read, and delete end-to-end encrypted notes.

Usage:
  vailnote create [content] [options]      Create an encrypted note, print the share link.
                                           If content is omitted, it is read from stdin
                                           (recommended for secrets - argv can leak via
                                           process listings and shell history).
  vailnote read <link-or-id> [options]     Fetch and decrypt a note, print plaintext to stdout.
  vailnote delete <link-or-id> [options]   Permanently delete a note (manual-deletion notes).
  vailnote env [file] [options]            Resolve VailNote links in a .env file (default: ./.env)
                                           to their decrypted values. Prints \`export KEY='value'\`
                                           lines for shell sourcing, or JSON with --json. Notes
                                           referenced in .env should be created with --manual-deletion.
  vailnote version                         Print the CLI version.

Options:
  -p, --password <pw>      Password for the note. Prefer the VAILNOTE_PASSWORD
                           environment variable so it never appears in argv.
  -e, --expires-in <opt>   ${EXPIRY_OPTIONS.join('|')} (default: 24h)
  -m, --manual-deletion    Keep the note until it is explicitly deleted.
                           Without it, the note self-destructs after the first read.
  -o, --origin <url>       API origin (default: ${DEFAULT_ORIGIN}, env VAILNOTE_ORIGIN).
  -j, --json               Machine-readable output on stdout.
  -h, --help               Show this help.

Examples:
  echo "sk-secret" | deno run --allow-net --allow-env --allow-read cli/main.ts create
  deno run --allow-net --allow-env --allow-read cli/main.ts create "hello world" --expires-in 10m
  deno run --allow-net --allow-env --allow-read cli/main.ts read "https://vailnote.com/<id>#auth=<key>"
  VAILNOTE_PASSWORD=my-pw deno run --allow-net --allow-env --allow-read cli/main.ts read "<link>"
  deno run --allow-net --allow-env --allow-read cli/main.ts env                       # resolve ./.env
  deno run --allow-net --allow-env --allow-read cli/main.ts env ./.env.local --json  # or a specific file

Install globally:
  npm install -g vailnote                 # requires Node 18+; no Deno needed
  deno install -g -n vailnote --allow-net --allow-env --allow-read cli/main.ts
Then use the \`vailnote\` command directly, e.g. \`vailnote create\`, \`vailnote read <link>\`.
Prebuilt binaries are also available on the GitHub Releases page.

The note content never touches the disk unencrypted. Decryption always
happens locally; the server only ever stores ciphertext.`;

/**
 * Parse a note link into its ID and optional auth key.
 * Accepts a full URL (https://vailnote.com/<id>#auth=<key> or ?auth=<key>)
 * or a bare `<id>` / `<id>#auth=<key>`.
 */
export function parseNoteLink(link: string): { id: string; authKey?: string } {
    const trimmed = link.trim();
    if (!trimmed) {
        throw new CliError('No note link or ID provided');
    }

    let id: string | undefined;
    let authKey: string | undefined;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        id = url.pathname.split('/').filter(Boolean).at(-1);
        authKey = url.searchParams.get('auth') ??
            new URLSearchParams(url.hash.slice(1)).get('auth') ?? undefined;
    } else {
        const hashIndex = trimmed.indexOf('#');
        id = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
        authKey = hashIndex === -1
            ? undefined
            : new URLSearchParams(trimmed.slice(hashIndex + 1)).get('auth') ?? undefined;
    }

    if (!id) {
        throw new CliError(`Could not extract a note ID from: ${trimmed}`);
    }

    const result: { id: string; authKey?: string } = { id };
    if (authKey) {
        result.authKey = authKey;
    }
    return result;
}

/**
 * Parse command-line arguments into a CliOptions object.
 * Supports `--flag value` and `--flag=value` forms.
 */
export function parseArgs(argv: string[]): CliOptions {
    const opts: CliOptions = {
        command: 'create',
        positional: [],
        expiresIn: '24h',
        manualDeletion: false,
        origin: Deno.env.get('VAILNOTE_ORIGIN') || DEFAULT_ORIGIN,
        json: false,
    };

    let command = '';
    let i = 0;
    const envPassword = Deno.env.get('VAILNOTE_PASSWORD');
    if (envPassword) {
        opts.password = envPassword;
    }

    for (; i < argv.length; i++) {
        const arg = argv[i];

        if (!command && !arg.startsWith('-')) {
            command = arg;
            continue;
        }

        if (arg === '-h' || arg === '--help') {
            throw new HelpRequested();
        }

        if (arg === '-j' || arg === '--json') {
            opts.json = true;
            continue;
        }

        if (arg === '-m' || arg === '--manual-deletion') {
            opts.manualDeletion = true;
            continue;
        }

        const [flag, inlineValue] = arg.startsWith('--') && arg.includes('=')
            ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)]
            : [arg, undefined];

        if (flag === '-p' || flag === '--password') {
            opts.password = inlineValue ?? argv[++i];
            if (opts.password === undefined || opts.password === '') {
                throw new CliError('--password requires a value (or use the VAILNOTE_PASSWORD environment variable)');
            }
            continue;
        }

        if (flag === '-e' || flag === '--expires-in') {
            const value = inlineValue ?? argv[++i];
            if (value === undefined || !(EXPIRY_OPTIONS as readonly string[]).includes(value)) {
                throw new CliError(`--expires-in must be one of: ${EXPIRY_OPTIONS.join(', ')}`);
            }
            opts.expiresIn = value as ExpiryOption;
            continue;
        }

        if (flag === '-o' || flag === '--origin') {
            const value = inlineValue ?? argv[++i];
            if (value === undefined || value === '') {
                throw new CliError('--origin requires a value');
            }
            opts.origin = value.replace(/\/$/, '');
            continue;
        }

        if (arg.startsWith('-')) {
            throw new CliError(`Unknown option: ${arg}`);
        }

        opts.positional.push(arg);
    }

    if (!command) {
        if (opts.positional.length > 0) {
            opts.command = opts.positional[0];
            opts.positional = opts.positional.slice(1);
        } else {
            opts.command = 'create';
        }
    } else {
        opts.command = command;
    }

    if (!['create', 'read', 'delete', 'env', 'version'].includes(opts.command)) {
        throw new CliError(`Unknown command: ${opts.command}`);
    }

    return opts;
}

class HelpRequested extends Error {}

interface ApiErrorBody {
    message?: string;
    retryAfter?: number;
}

async function apiRequest(
    origin: string,
    path: string,
    method: 'POST' | 'DELETE',
    body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    let response: Response;
    try {
        response = await fetch(`${origin}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new CliError(`Could not reach ${origin}. Check the origin and your network connection.`);
    }

    let data: ApiErrorBody & Record<string, unknown> = {};
    try {
        data = await response.json();
    } catch {
        // Non-JSON body (HTML error page, proxy response, etc.)
    }

    if (!response.ok) {
        let message = data?.message || `Request failed with HTTP ${response.status}`;
        if (response.status === 429 && typeof data?.retryAfter === 'number') {
            message = `${message} Retry in ${Math.ceil(data.retryAfter)} seconds.`;
        }
        throw new CliError(message);
    }

    return data;
}

async function readStdin(): Promise<string> {
    const chunks: string[] = [];
    const decoder = new TextDecoder();
    for await (const chunk of Deno.stdin.readable) {
        chunks.push(decoder.decode(chunk));
    }
    return chunks.join('');
}

/**
 * Encrypt content locally and create a note on the server.
 * Returns the note ID, auth key, and the full share link.
 */
export async function createNote(content: string, opts: CliOptions): Promise<CreateResult> {
    if (!content.trim()) {
        throw new CliError('Note content cannot be empty');
    }
    if (content.length > NOTE_CONTENT_MAX_LENGTH) {
        throw new CliError(`Note content is too long (max ${NOTE_CONTENT_MAX_LENGTH} bytes)`);
    }

    const { encryptedContent, passwordHash, authKey } = await prepareEncryption(content, opts.password);

    const data = await apiRequest(opts.origin, '/api/notes', 'POST', {
        content: encryptedContent.encrypted,
        iv: encryptedContent.iv,
        password: passwordHash,
        expiresIn: EXPIRY_API_VALUES[opts.expiresIn],
        manualDeletion: opts.manualDeletion,
    });

    if (typeof data.noteId !== 'string') {
        throw new CliError('Server response did not include a note ID');
    }

    return {
        noteId: data.noteId,
        authKey,
        link: `${opts.origin}/${data.noteId}#auth=${authKey}`,
        expiresIn: opts.expiresIn,
    };
}

/**
 * Fetch a note and decrypt it locally. Password-protected notes require
 * a password (--password or VAILNOTE_PASSWORD); notes without a password
 * are unlocked by the auth key embedded in the link.
 */
export async function readNote(link: string, opts: CliOptions): Promise<ReadResult> {
    const { id, authKey } = parseNoteLink(link);
    const password = opts.password;
    const passwordHash = password ? await generateDeterministicClientHash(password) : undefined;

    const data = await apiRequest(opts.origin, `/api/notes/${id}`, 'POST', { passwordHash });

    if (typeof data.content !== 'string' || typeof data.iv !== 'string') {
        throw new CliError('Server response did not include note data');
    }

    if (!authKey && !password) {
        throw new CliError(
            'This note cannot be decrypted: the link has no auth key and no password was provided.',
        );
    }

    // Password-protected notes are encrypted with password + auth key combined;
    // legacy password-only notes (no auth key in the link) use the password alone.
    const decryptionKey = password ? (authKey ? combineNoteSecrets(password, authKey) : password) : authKey as string;

    let decrypted: string;
    try {
        decrypted = await decryptNoteContent(data.content, data.iv, decryptionKey);
    } catch {
        throw new CliError(
            'Failed to decrypt the note. The auth key or password is incorrect.',
        );
    }

    return {
        id,
        content: decrypted,
        expiresIn: typeof data.expiresIn === 'string' ? data.expiresIn : '',
        manualDeletion: data.manualDeletion === true,
    };
}

/**
 * Permanently delete a note. Required for manual-deletion notes; harmless
 * for auto-deleting notes that were already destroyed.
 */
export async function deleteNote(link: string, opts: CliOptions): Promise<{ noteId: string }> {
    const { id } = parseNoteLink(link);
    const passwordHash = opts.password ? await generateDeterministicClientHash(opts.password) : undefined;

    await apiRequest(opts.origin, `/api/notes/${id}`, 'DELETE', { passwordHash });
    return { noteId: id };
}

/**
 * Whether a .env value is a VailNote link for the configured origin.
 * Only links under the configured origin are resolved, so unrelated URLs
 * pass through untouched.
 */
export function isVailNoteLink(value: string, origin: string): boolean {
    if (!value.startsWith(`${origin}/`)) {
        return false;
    }
    try {
        parseNoteLink(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse .env text into key/value pairs without variable expansion (secrets
 * may contain `$`). Supports blank lines, `#` comments, an optional `export`
 * prefix, and single- or double-quoted values with escaped quotes.
 */
export function parseEnvFile(text: string): Record<string, string> {
    const env: Record<string, string> = {};
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim().replace(/^export\s+/, '');
        if (!line || line.startsWith('#')) {
            continue;
        }
        const eq = line.indexOf('=');
        if (eq === -1) {
            continue;
        }
        const key = line.slice(0, eq).trim();
        if (!key) {
            continue;
        }
        let value = line.slice(eq + 1).trim();
        if (
            value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'")))
        ) {
            value = value.slice(1, -1);
            if (value[0] !== "'") {
                value = value.replace(/\\(["\\])/g, '$1');
            }
        }
        env[key] = value;
    }
    return env;
}

export interface ResolveEnvResult {
    env: Record<string, string>;
    resolvedKeys: string[];
}

/**
 * Resolve every VailNote link in an env record to its decrypted value.
 * Values that are not VailNote links are left untouched. Fails fast (naming
 * the offending key) if a link cannot be resolved, so a stale or expired
 * link never silently leaves a secret unresolved.
 */
export async function resolveEnv(
    env: Record<string, string>,
    opts: CliOptions,
    resolve: (link: string, opts: CliOptions) => Promise<string> = async (link, options) =>
        (await readNote(link, options)).content,
): Promise<ResolveEnvResult> {
    const resolvedKeys: string[] = [];
    for (const [key, value] of Object.entries(env)) {
        if (!isVailNoteLink(value, opts.origin)) {
            continue;
        }
        try {
            // Strip trailing newlines: env values are usually created with
            // `echo`, which appends one. read keeps content byte-exact.
            env[key] = (await resolve(value, opts)).replace(/\r?\n+$/, '');
            resolvedKeys.push(key);
        } catch (error) {
            throw new CliError(
                `Failed to resolve VailNote link for ${key}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
    return { env, resolvedKeys };
}

/**
 * Format an env record as shell-sourceable `export KEY='value'` lines.
 * Values are single-quoted (with the shell's `'\''` escape) so secrets
 * containing spaces, `$`, or quotes survive sourcing without expansion.
 */
export function formatEnvOutput(env: Record<string, string>): string {
    return Object.entries(env)
        .map(([key, value]) => `export ${key}='${value.replaceAll("'", "'\\''")}'`)
        .join('\n');
}

function printCreateResult(result: CreateResult, opts: CliOptions): void {
    if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }
    console.log('Note created and encrypted before sending to the server.\n');
    console.log('Share this link:');
    console.log(result.link);
    console.log('\nThe link contains the decryption key - anyone who holds it can read the note.');
    console.log(
        `Expires in ${result.expiresIn}. ${
            opts.manualDeletion ? 'It persists until manually deleted.' : 'It self-destructs after the first read.'
        }`,
    );
    console.log(`\nPassword: ${opts.password ? 'set (required to open)' : 'none (link alone opens the note)'}`);
}

function printReadResult(result: ReadResult, opts: CliOptions): void {
    if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }
    if (!result.manualDeletion) {
        console.error('Note fetched - it self-destructed after this read.');
    }
    console.log(result.content);
}

async function main(argv: string[]): Promise<void> {
    try {
        const opts = parseArgs(argv);

        if (opts.command === 'version') {
            console.log(`vailnote-cli ${CLI_VERSION}`);
            return;
        }

        if (opts.command === 'env') {
            const filePath = opts.positional[0] || './.env';
            let text: string;
            try {
                text = await Deno.readTextFile(filePath);
            } catch (error) {
                throw new CliError(
                    `Could not read ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
                );
            }

            const { env } = await resolveEnv(parseEnvFile(text), opts);
            if (opts.json) {
                console.log(JSON.stringify(env, null, 2));
            } else {
                console.log(formatEnvOutput(env));
            }
            return;
        }

        if (opts.command === 'create') {
            let content = opts.positional.join(' ');
            if (!content.trim()) {
                content = await readStdin();
            }
            const result = await createNote(content, opts);
            printCreateResult(result, opts);
            return;
        }

        const target = opts.positional[0];
        if (!target) {
            throw new CliError(`The ${opts.command} command requires a note link or ID`);
        }

        if (opts.command === 'read') {
            const result = await readNote(target, opts);
            printReadResult(result, opts);
            return;
        }

        const result = await deleteNote(target, opts);
        if (opts.json) {
            console.log(JSON.stringify({ deleted: true, noteId: result.noteId }, null, 2));
        } else {
            console.log(`Note ${result.noteId} deleted.`);
        }
    } catch (error) {
        if (error instanceof HelpRequested) {
            console.log(USAGE);
            return;
        }
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        Deno.exit(1);
    }
}

/**
 * Entry point for the CLI. Kept separate from the auto-run below so the
 * bundled npm build (bin/vailnote.mjs) can drive it under Node.
 */
export async function runCli(args: string[]): Promise<void> {
    await main(args);
}

if (import.meta.main) {
    await runCli(Deno.args);
}
