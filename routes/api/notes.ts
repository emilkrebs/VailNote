import { noteDatabase } from '../../database/db.ts';
import { formatExpiration, Note } from '../../types/types.ts';
import { generateHash } from '../../utils/hashing.ts';

/* used for client side note creation and encryption
    * This endpoint handles both GET and POST requests.
    * - GET: Fetches a note by its ID.
    * - POST: Creates a new note with the provided content, IV, password, and expiration time.
    *
    * Note: The content should be encrypted before sending to this endpoint and the password should be hashed with SHA-256.
    * 
    * TODO: Add rate limiting to prevent abuse:
    * - Limit requests per IP (e.g., 10 notes per minute)
    * - Implement exponential backoff for failed attempts
    * - Consider CAPTCHA for suspicious activity
*/


export const handler = async (req: Request): Promise<Response> => {
	if (req.method !== 'POST' && req.method !== 'GET') {
		return new Response('Method not allowed', { status: 405 });
	}

	if (req.method === 'GET') {
		return new Response('GET method not implemented', { status: 501 });
	}

	const { content, iv, password, expiresAt } = await req.json();
	
	// Input validation and size limits
	if (!content || content === '' || !iv || !expiresAt) {
		return new Response('Content, IV, and expiration time are required', {
			status: 400,
		});
	}
	
	// Security: Limit input sizes to prevent DoS
	if (content.length > 1024 * 1024) { // 1MB limit
		return new Response('Content too large (max 1MB)', { status: 413 });
	}
	
	if (password && password.length > 1024) { // 1KB password limit
		return new Response('Password too long', { status: 400 });
	}

	const noteId = await noteDatabase.generateNoteId();

	// if password is provided, hash it (password should be hashed with SHA-256 before sending to this endpoint)
	const passwordHash = password ? await generateHash(password) : undefined;

	// check if content is encrypted
	const result: Note = {
		id: noteId,
		content, // content should be encrypted before sending to this endpoint
		password: passwordHash, // password should be hashed before sending to this endpoint
		iv: iv,
		expiresAt: formatExpiration(expiresAt),
	};

	await noteDatabase.insertNote(result);

	return new Response(
		JSON.stringify({
			message: 'Note saved successfully!',
			noteId: noteId,
			noteLink: `${new URL(req.url).origin}/${noteId}`,
		}),
		{
			headers: { 'Content-Type': 'application/json' },
			status: 201,
		},
	);
};
