import { assertEquals, assertRejects, assertThrows } from '$std/assert/mod.ts';
import { decryptNoteContent } from '../lib/encryption.ts';
import { combineNoteSecrets, prepareEncryption } from '../lib/services/crypto-service.ts';
import {
    EXPIRY_API_VALUES,
    formatEnvOutput,
    isVailNoteLink,
    parseArgs,
    parseEnvFile,
    parseNoteLink,
    resolveEnv,
} from '../cli/main.ts';

Deno.test({
    name: 'CLI - parseNoteLink',
    fn: async (t) => {
        await t.step('parses a full URL with auth key in the hash', () => {
            assertEquals(
                parseNoteLink('https://vailnote.com/abc123#auth=secretKey'),
                { id: 'abc123', authKey: 'secretKey' },
            );
        });

        await t.step('parses a full URL with auth key as a query parameter', () => {
            assertEquals(
                parseNoteLink('https://vailnote.com/abc123?auth=secretKey'),
                { id: 'abc123', authKey: 'secretKey' },
            );
        });

        await t.step('parses a full URL without an auth key', () => {
            assertEquals(
                parseNoteLink('https://vailnote.com/abc123'),
                { id: 'abc123' },
            );
        });

        await t.step('parses a bare note ID', () => {
            assertEquals(parseNoteLink('abc123'), { id: 'abc123' });
        });

        await t.step('parses a bare ID with an auth key', () => {
            assertEquals(parseNoteLink('abc123#auth=secretKey'), { id: 'abc123', authKey: 'secretKey' });
        });

        await t.step('trims surrounding whitespace', () => {
            assertEquals(parseNoteLink('  abc123  '), { id: 'abc123' });
        });

        await t.step('rejects an empty link', () => {
            assertThrows(() => parseNoteLink(''), Error);
        });

        await t.step('rejects a URL without a note ID', () => {
            assertThrows(() => parseNoteLink('https://vailnote.com/'), Error);
        });
    },
});

Deno.test({
    name: 'CLI - parseArgs',
    fn: async (t) => {
        await t.step('defaults to the create command and 24h expiry', () => {
            const opts = parseArgs(['create', 'hello']);
            assertEquals(opts.command, 'create');
            assertEquals(opts.expiresIn, '24h');
            assertEquals(opts.manualDeletion, false);
            assertEquals(opts.json, false);
            assertEquals(opts.positional, ['hello']);
        });

        await t.step('treats a positional command-less first arg as the command', () => {
            const opts = parseArgs(['version']);
            assertEquals(opts.command, 'version');
        });

        await t.step('parses flags with values', () => {
            const opts = parseArgs(['create', '--password', 'pw', '--expires-in', '10m', '--manual-deletion']);
            assertEquals(opts.password, 'pw');
            assertEquals(opts.expiresIn, '10m');
            assertEquals(opts.manualDeletion, true);
        });

        await t.step('parses --flag=value form', () => {
            const opts = parseArgs(['read', '--expires-in=1h', '--password=secret', '--json']);
            assertEquals(opts.expiresIn, '1h');
            assertEquals(opts.password, 'secret');
            assertEquals(opts.json, true);
        });

        await t.step('reads the password from VAILNOTE_PASSWORD', () => {
            Deno.env.set('VAILNOTE_PASSWORD', 'envSecret');
            try {
                const opts = parseArgs(['create', 'hello']);
                assertEquals(opts.password, 'envSecret');
            } finally {
                Deno.env.delete('VAILNOTE_PASSWORD');
            }
        });

        await t.step('rejects an unknown command', () => {
            assertThrows(() => parseArgs(['frobnicate']), Error);
        });

        await t.step('rejects an unknown option', () => {
            assertThrows(() => parseArgs(['create', '--bogus']), Error);
        });

        await t.step('rejects an invalid expiration value', () => {
            assertThrows(() => parseArgs(['create', '--expires-in', 'forever']), Error);
        });

        await t.step('maps short expiry codes to the API values', () => {
            assertEquals(EXPIRY_API_VALUES['10m'], '10 minutes');
            assertEquals(EXPIRY_API_VALUES['1h'], '1 hour');
            assertEquals(EXPIRY_API_VALUES['24h'], '24 hours');
            assertEquals(EXPIRY_API_VALUES['30d'], '30 days');
            assertEquals(EXPIRY_API_VALUES['90d'], '90 days');
            assertEquals(EXPIRY_API_VALUES['180d'], '180 days');
        });
    },
});

Deno.test({
    name: 'CLI - env command',
    fn: async (t) => {
        await t.step('parses the env command', () => {
            const opts = parseArgs(['env']);
            assertEquals(opts.command, 'env');
        });

        await t.step('parseEnvFile handles comments, quotes, and export prefix', () => {
            const env = parseEnvFile(
                [
                    '# a comment',
                    'PLAIN=value',
                    'QUOTED="hello world"',
                    "SINGLE='it's fine'",
                    'export EXPORTED=exported-value',
                    'ESCAPED="a \\"quote\\""',
                    'WITH_DOLLAR=$HOME/secret',
                    'EMPTY=',
                    '',
                ].join('\n'),
            );
            assertEquals(env.PLAIN, 'value');
            assertEquals(env.QUOTED, 'hello world');
            assertEquals(env.SINGLE, "it's fine");
            assertEquals(env.EXPORTED, 'exported-value');
            assertEquals(env.ESCAPED, 'a "quote"');
            assertEquals(env.WITH_DOLLAR, '$HOME/secret');
            assertEquals(env.EMPTY, '');
            assertEquals(env.UNKNOWN, undefined);
        });

        await t.step('isVailNoteLink only matches the configured origin', () => {
            assertEquals(isVailNoteLink('https://vailnote.com/abc123#auth=key', 'https://vailnote.com'), true);
            assertEquals(isVailNoteLink('https://other.com/abc123#auth=key', 'https://vailnote.com'), false);
            assertEquals(isVailNoteLink('sk-plain-key', 'https://vailnote.com'), false);
            assertEquals(isVailNoteLink('https://vailnote.com/', 'https://vailnote.com'), false);
        });

        await t.step('resolveEnv resolves links, leaves other values untouched', async () => {
            const fakeResolve = (link: string): Promise<string> => Promise.resolve(`resolved:${link}`);
            const { env, resolvedKeys } = await resolveEnv(
                {
                    OPEN_AI_API_KEY: 'https://vailnote.com/abc123#auth=key',
                    OTHER: 'https://vailnote.com/def456#auth=key2',
                    PLAIN: 'sk-plain',
                    DATABASE_URL: 'postgres://localhost/db',
                },
                parseArgs(['env']),
                fakeResolve,
            );
            assertEquals(env.OPEN_AI_API_KEY, 'resolved:https://vailnote.com/abc123#auth=key');
            assertEquals(env.OTHER, 'resolved:https://vailnote.com/def456#auth=key2');
            assertEquals(env.PLAIN, 'sk-plain');
            assertEquals(env.DATABASE_URL, 'postgres://localhost/db');
            assertEquals(resolvedKeys, ['OPEN_AI_API_KEY', 'OTHER']);
        });

        await t.step('resolveEnv strips trailing newlines from resolved values', async () => {
            const fakeResolve = (): Promise<string> => Promise.resolve('sk-key\n');
            const { env } = await resolveEnv(
                { SECRET: 'https://vailnote.com/abc123#auth=key' },
                parseArgs(['env']),
                fakeResolve,
            );
            assertEquals(env.SECRET, 'sk-key');
        });

        await t.step('resolveEnv fails fast naming the offending key', async () => {
            const failingResolve = (): Promise<string> => Promise.reject(new Error('Note not found'));
            await assertRejects(
                async () => {
                    await resolveEnv(
                        { SECRET: 'https://vailnote.com/abc123#auth=key' },
                        parseArgs(['env']),
                        failingResolve,
                    );
                },
                Error,
                'SECRET',
            );
        });

        await t.step('formatEnvOutput produces sourceable, single-quoted exports', () => {
            const output = formatEnvOutput({
                OPEN_AI_API_KEY: 'sk-$secret',
                QUOTED: "it's",
                SPACES: 'a b c',
            });
            assertEquals(
                output,
                "export OPEN_AI_API_KEY='sk-$secret'\nexport QUOTED='it'\\''s'\nexport SPACES='a b c'",
            );
        });
    },
});

Deno.test({
    name: 'CLI - encryption roundtrip matches the web client scheme',
    fn: async (t) => {
        await t.step('roundtrips a note without a password using the auth key', async () => {
            const content = 'sk-test-api-key-12345';
            const { encryptedContent, authKey } = await prepareEncryption(content);

            // Decrypt exactly like readNote does for passwordless notes.
            const decrypted = await decryptNoteContent(encryptedContent.encrypted, encryptedContent.iv, authKey);
            assertEquals(decrypted, content);
        });

        await t.step('roundtrips a password-protected note using the combined secret', async () => {
            const content = 'sk-test-api-key-67890';
            const password = 'hunter2';
            const { encryptedContent, authKey } = await prepareEncryption(content, password);

            const decryptionKey = combineNoteSecrets(password, authKey);
            const decrypted = await decryptNoteContent(encryptedContent.encrypted, encryptedContent.iv, decryptionKey);
            assertEquals(decrypted, content);
        });

        await t.step('fails to decrypt with the wrong password', async () => {
            const content = 'sk-test-api-key-11111';
            const password = 'correct-password';
            const { encryptedContent, authKey } = await prepareEncryption(content, password);

            const wrongKey = combineNoteSecrets('wrong-password', authKey);
            await assertRejects(
                () => decryptNoteContent(encryptedContent.encrypted, encryptedContent.iv, wrongKey),
                Error,
            );
        });
    },
});
