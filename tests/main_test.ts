import { createHandler, ServeHandlerInfo } from '$fresh/server.ts';
import manifest from '../fresh.gen.ts';
import config from '../fresh.config.ts';
import { assertEquals } from '$std/assert/assert_equals.ts';
import { assertMatch } from '$std/assert/assert_match.ts';
import { generateSHA256Hash } from '../utils/hashing.ts';
import { encryptNoteContent } from '../utils/encryption.ts';

// Since we can't easily mock the global database in the routes,
// let's just use the global database but ensure proper cleanup
import { closeDatabase, initializeDatabase } from '../database/db.ts';
import { TestNoteDatabase } from './test-database.ts';

const hostname = '127.0.0.1';

const CONN_INFO: ServeHandlerInfo = {
	remoteAddr: { hostname, port: 53496, transport: 'tcp' },
	completed: Promise.resolve(),
};

const testNoteData = {
	content: 'This is a test note.',
	password: 'testpassword',
	expiresIn: '1 hour',
};

// Array to store created note IDs and their passwords
const createdNotes: { id: string; password: string; content: string }[] = [];

Deno.test('HTTP assert test.', async (t) => {
	// Create and use test database for this test
	const testDatabase = await TestNoteDatabase.getInstance();
	await initializeDatabase(testDatabase);

	try {
		const handler = await createHandler(manifest, config);

		await t.step('#1 GET /', async () => {
			const resp = await handler(new Request(`http://${hostname}/`), CONN_INFO);
			assertEquals(resp.status, 200);
		});
	} finally {
		await closeDatabase();
		await TestNoteDatabase.cleanup();
	}
});

Deno.test('Note submission test.', async (t) => {
	// Create test database and clear any existing data
	const testDatabase = await TestNoteDatabase.getInstance();
	await initializeDatabase(testDatabase);
	await TestNoteDatabase.clearTestData();

	try {
		const handler = await createHandler(manifest, config);

		await t.step('#2 POST (No JavaScript) /', async () => {
			const formData = new FormData();
			formData.append('noteContent', testNoteData.content);
			formData.append('notePassword', testNoteData.password);
			formData.append('expiresIn', testNoteData.expiresIn);

			const resp = await handler(
				new Request(`http://${hostname}/`, {
					method: 'POST',
					body: formData,
				}),
				CONN_INFO,
			);

			const result = await resp.text();
			assertMatch(result, /Note saved successfully!/);

			// Extract the note ID from the response
			const noteIdMatch = result.match(/Note ID: (\w+)/);
			if (noteIdMatch) {
				createdNotes.push({ id: noteIdMatch[1], password: testNoteData.password, content: testNoteData.content });
				console.log(`Created note ID via form: ${noteIdMatch[1]}`);
			}
			assertEquals(resp.status, 200);
		});

		await t.step('#3 POST /api/notes', async () => {
			const passwordSHA256 = await generateSHA256Hash(testNoteData.password);
			const encryptedContent = await encryptNoteContent(
				testNoteData.content,
				passwordSHA256,
			);

			const resp = await handler(
				new Request(`http://${hostname}/api/notes`, {
					method: 'POST',
					body: JSON.stringify({
						content: encryptedContent.encrypted,
						iv: encryptedContent.iv,
						password: passwordSHA256, // Password should be hashed with SHA-256 before sending
						expiresAt: testNoteData.expiresIn,
					}),
					headers: { 'Content-Type': 'application/json' },
				}),
				CONN_INFO,
			);

			const data = await resp.json();
			createdNotes.push({ id: data.noteId, password: testNoteData.password, content: testNoteData.content });
			console.log(`Created note ID via API: ${data.noteId}`);
			assertEquals(data.message, 'Note saved successfully!');
			assertEquals(resp.status, 201);
		});
	} finally {
		// Cleanup the global database connection
		await closeDatabase();
		await TestNoteDatabase.cleanup();
	}
});

/* Test reading created notes
*/
Deno.test('Read created notes', async () => {
	// Create and use test database
	const testDatabase = await TestNoteDatabase.getInstance();
	await initializeDatabase(testDatabase);

	try {
		const handler = await createHandler(manifest, config);

		for (const note of createdNotes) {
			console.log(`Testing note ID: ${note.id}`);

			if (note.password) {
				const formData = new FormData();
				formData.append('password', note.password);
				formData.append('confirm', 'true');

				const resp = await handler(
					new Request(`http://${hostname}/${note.id}`, {
						method: 'POST',
						body: formData,
					}),
					CONN_INFO,
				);

				const result = await resp.text();
				assertMatch(result, new RegExp(note.content));
				assertEquals(resp.status, 200);
			}
		}
	} finally {
		await closeDatabase();
		await TestNoteDatabase.cleanup();
	}
});
