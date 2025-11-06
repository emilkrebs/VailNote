import { assertEquals, assertExists } from '$std/assert/mod.ts';
import { generateDeterministicClientHash } from '../lib/hashing.ts';
import { encryptNoteContent } from '../lib/encryption.ts';
import { App } from 'fresh';
import Home from '../routes/index.tsx';
import { State } from '../lib/types/common.ts';

// Test data factory
export class TestDataFactory {
    static createNoteData(overrides?: Partial<typeof TestDataFactory.defaultNoteData>) {
        return {
            ...TestDataFactory.defaultNoteData,
            ...overrides,
        };
    }

    private static readonly defaultNoteData = {
        content: 'This is a test note.',
        password: 'testpassword',
        expiresIn: '1 hour',
    };
}

// Test suite for basic HTTP functionality
Deno.test({
    name: 'HTTP - Basic functionality',
    fn: async (t) => {
        const app = new App<State>()
            .get('/', (ctx) => ctx.render(Home()));

        const handler = app.handler();

        await t.step('should return 200 for GET /', async () => {
            const response = await handler(new Request(`http://localhost`));
            assertEquals(response.status, 200);
        });

        await t.step('should return 404 for non-existent route', async () => {
            const response = await handler(new Request(`http://localhost/non-existent`));
            assertEquals(response.status, 404);
        });
    },
    sanitizeResources: false,
    sanitizeOps: false,
});

// Test suite for note operations
Deno.test({
    name: 'Notes - CRUD operations',
    fn: async (t) => {
        const { handler: notesHandler } = await import('../routes/api/notes.ts');
        const { handler: notesIdHandler } = await import('../routes/api/notes/[id].ts');

        const handler = new App<State>()
            .post('/api/notes', async (ctx) => await notesHandler.POST(ctx))
            .post('/api/notes/:id', async (ctx) => await notesIdHandler(ctx))
            .handler();

        let apiNoteId: string;
        const testData = TestDataFactory.createNoteData();

        await t.step('should create note via API', async () => {
            const passwordClientHash = await generateDeterministicClientHash(testData.password);
            const authKey = 'testAuthKey123';
            const authKeyClientHash = await generateDeterministicClientHash(authKey);
            const encryptionKey = `${authKey}:${testData.password}`; // Combined key for encryption
            const encryptedContent = await encryptNoteContent(testData.content, encryptionKey);

            const response = await handler(
                new Request(`http://localhost/api/notes`, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: encryptedContent.encrypted,
                        iv: encryptedContent.iv,
                        password: passwordClientHash,
                        authKey: authKeyClientHash,
                        expiresIn: testData.expiresIn,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

            assertEquals(response.status, 201);

            const data = await response.json();
            assertEquals(data.message, 'Note saved successfully!');
            assertExists(data.noteId, 'Note ID should be present in API response');
            apiNoteId = data.noteId;
        });

        await t.step('should retrieve note by ID', async () => {
            const passwordHash = await generateDeterministicClientHash(testData.password);
            const authKey = 'testAuthKey123';
            const authKeyHash = await generateDeterministicClientHash(authKey);

            const response = await handler(
                new Request(`http://localhost/api/notes/${apiNoteId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ passwordHash, authKeyHash }),
                }),
            );

            const data = await response.json();
            assertExists(data.id, 'Note ID should be present in response');
            assertEquals(response.status, 200);
        });

        await t.step('should reject API request with missing content', async () => {
            const response = await handler(
                new Request(`http://localhost/api/notes`, {
                    method: 'POST',
                    body: JSON.stringify({
                        // Missing content
                        password: 'test123',
                        expiresIn: '1 hour',
                    }),
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

            assertEquals(response.status >= 400, true);
        });

        await t.step('should reject API request with invalid JSON', async () => {
            const response = await handler(
                new Request(`http://localhost/api/notes`, {
                    method: 'POST',
                    body: 'invalid json',
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

            assertEquals(response.status >= 400, true);
        });
    },
    sanitizeResources: false,
    sanitizeOps: false,
});
