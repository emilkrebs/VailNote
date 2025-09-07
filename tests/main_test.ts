import { assertEquals, assertExists } from '$std/assert/mod.ts';
import { generateDeterministicClientHash } from '../lib/hashing.ts';
import { encryptNoteContent } from '../lib/encryption.ts';

// deno-lint-ignore no-explicit-any
const middleware = async (ctx: any) => {
	if (!Deno.env.get('BUILD_MODE')) {
		ctx.state.options = {
			testMode: true,
			databaseUri: Deno.env.get('TEST_DATABASE_URI'),
		};
	}
	return await ctx.next();
};

// Test data factory
class TestDataFactory {
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

const { app } = await import('./../_fresh/server.js');

app.use(middleware);

// Test suite for basic HTTP functionality
Deno.test({
	name: 'HTTP - Basic functionality',
	fn: async (t) => {
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
		const handler = app.handler();
		let apiNoteId: string;
		const testData = TestDataFactory.createNoteData();

		await t.step('should create note via API', async () => {
			const passwordClientHash = await generateDeterministicClientHash(testData.password);
			const encryptedContent = await encryptNoteContent(testData.content, testData.password);

			const response = await handler(
				new Request(`http://localhost/api/notes`, {
					method: 'POST',
					body: JSON.stringify({
						content: encryptedContent.encrypted,
						iv: encryptedContent.iv,
						password: passwordClientHash,
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
			const response = await handler(
				new Request(`http://localhost/api/notes/${apiNoteId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ passwordHash }),
				}),
			);

			const data = await response.json();
			assertExists(data.id, 'Note ID should be present in response');
			assertEquals(response.status, 200);
		});

		await t.step('should handle non-existent note', async () => {
			const response = await handler(
				new Request(`http://localhost/nonexistent123`),
			);

			assertEquals(response.status, 404);
		});
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

// Test suite for API validation
Deno.test({
	name: 'API - Input validation',
	fn: async (t) => {
		const handler = app.handler();

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
