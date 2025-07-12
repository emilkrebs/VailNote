import { createHandler, ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../fresh.gen.ts';
import config from '../fresh.config.ts';
import { assertEquals, assertExists, assertMatch } from '$std/assert/mod.ts';
import { generateDeterministicClientHash } from '../utils/hashing.ts';
import { encryptNoteContent } from '../utils/encryption.ts';
import { Context } from '../routes/_middleware.ts';

// Test configuration constants
const TEST_CONFIG = {
	hostname: '127.0.0.1',
	port: 53496,
} as const;

const CONN_INFO: ServeHandlerInfo = {
	remoteAddr: { hostname: TEST_CONFIG.hostname, port: TEST_CONFIG.port, transport: 'tcp' },
	completed: Promise.resolve(),
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

// Test utilities
class TestUtils {
	static async setupTestEnvironment(): Promise<void> {
		Deno.env.set('TEST_MODE', 'true');

		// Reinitialize context with test mode
		await Context.init({
			testMode: true,
			databaseUri: Deno.env.get('BASE_URI') || '',
			testDatabaseUri: Deno.env.get('TEST_BASE_URI') || '',
		});

		if (!Context.instance().isTestMode()) {
			throw new Error('Test environment is not set up correctly. Exiting test.');
		}
	}

	static async clearTestDatabase(): Promise<void> {
		try {
			const context = Context.instance();
			const db = context.getNoteDatabase();
			await db.clearAllNotes();
		} catch (error) {
			console.warn('Failed to clear test database:', error);
		}
	}

	static extractNoteIdFromResponse(response: string): string | null {
		const match = response.match(/Note ID: (\w+)/);
		return match ? match[1] : null;
	}
}

// Test suite for basic HTTP functionality
Deno.test({
	name: 'HTTP - Basic functionality',
	fn: async (t) => {
		await TestUtils.setupTestEnvironment();
		const handler = await createHandler(manifest, config);

		await t.step('should return 200 for GET /', async () => {
			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/`),
				CONN_INFO,
			);
			assertEquals(response.status, 200);
		});

		await t.step('should return 404 for non-existent route', async () => {
			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/non-existent`),
				CONN_INFO,
			);
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
		await TestUtils.setupTestEnvironment();
		await TestUtils.clearTestDatabase();

		const handler = await createHandler(manifest, config);
		const testData = TestDataFactory.createNoteData();
		let apiNoteId: string;

		await t.step('should create note via form submission', async () => {
			const formData = new FormData();
			formData.append('noteContent', testData.content);
			formData.append('notePassword', testData.password);
			formData.append('expiresIn', testData.expiresIn);

			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/`, {
					method: 'POST',
					body: formData,
				}),
				CONN_INFO,
			);

			assertEquals(response.status, 200);

			const responseText = await response.text();
			assertMatch(responseText, /Note saved successfully/);

			const extractedId = TestUtils.extractNoteIdFromResponse(responseText);
			assertExists(extractedId, 'Note ID should be present in response');
		});

		await t.step('should create note via API', async () => {
			const passwordClientHash = await generateDeterministicClientHash(testData.password);
			const encryptedContent = await encryptNoteContent(testData.content, testData.password);

			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/api/notes`, {
					method: 'POST',
					body: JSON.stringify({
						content: encryptedContent.encrypted,
						iv: encryptedContent.iv,
						password: passwordClientHash,
						expiresAt: testData.expiresIn,
					}),
					headers: { 'Content-Type': 'application/json' },
				}),
				CONN_INFO,
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
				new Request(`http://${TEST_CONFIG.hostname}/api/notes/${apiNoteId}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ passwordHash }),
				}),
				CONN_INFO,
			);

			const data = await response.json();
			assertExists(data.id, 'Note ID should be present in response');
			assertEquals(response.status, 200);
		});

		await t.step('should handle non-existent note', async () => {
			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/nonexistent123`),
				CONN_INFO,
			);

			assertEquals(response.status, 404);
		});

		// Cleanup
		await TestUtils.clearTestDatabase();
	},
	sanitizeResources: false,
	sanitizeOps: false,
});

// Test suite for API validation
Deno.test({
	name: 'API - Input validation',
	fn: async (t) => {
		await TestUtils.setupTestEnvironment();
		await TestUtils.clearTestDatabase();

		const handler = await createHandler(manifest, config);

		await t.step('should reject API request with missing content', async () => {
			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/api/notes`, {
					method: 'POST',
					body: JSON.stringify({
						// Missing content
						password: 'test123',
						expiresAt: '1 hour',
					}),
					headers: { 'Content-Type': 'application/json' },
				}),
				CONN_INFO,
			);

			assertEquals(response.status >= 400, true);
		});

		await t.step('should reject API request with invalid JSON', async () => {
			const response = await handler(
				new Request(`http://${TEST_CONFIG.hostname}/api/notes`, {
					method: 'POST',
					body: 'invalid json',
					headers: { 'Content-Type': 'application/json' },
				}),
				CONN_INFO,
			);

			assertEquals(response.status >= 400, true);
		});

		// Cleanup
		await TestUtils.clearTestDatabase();
	},
	sanitizeResources: false,
	sanitizeOps: false,
});
