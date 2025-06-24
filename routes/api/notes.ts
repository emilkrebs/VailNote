import { noteDatabase } from "../../database/db.ts";
import { formatExpiration, Note } from "../../types/types.ts";


/* used for client side note creation and encryption
    * This endpoint handles both GET and POST requests.
    * - GET: Fetches a note by its ID.
    * - POST: Creates a new note with the provided content, IV, password, and expiration time.
    * 
    * Note: The content should be encrypted before sending to this endpoint.
*/
export const handler = async (req: Request): Promise<Response> => {
    if (req.method !== "POST" && req.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
    }

    if (req.method == "GET") {
        const { noteId } = await req.json();
        if (!noteId) {
            return new Response("Note ID is required", { status: 400 });
        }
        const note = await noteDatabase.getNoteById(noteId);
        if (!note) {
            return new Response("Note not found", { status: 404 });
        }
        return new Response(JSON.stringify(note), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    }

    const { content, iv, password, expiresAt } = await req.json();
    if (!content || content === "" || !iv || !expiresAt) {
        return new Response("Content, IV, and expiration time are required", { status: 400 });
    }

    const noteId = await noteDatabase.generateNoteId();

    // check if content is encrypted
    const result: Note = {
      id: noteId,
      content, // content should be encrypted before sending to this endpoint
      password, // password should be hashed before sending to this endpoint
      iv: iv, 

      expiresAt: formatExpiration(expiresAt), 
    };

    await noteDatabase.insertNote(result);

    return new Response(JSON.stringify({ message: "Note saved successfully!", noteId: noteId, noteLink: `${new URL(req.url).origin}/${noteId}` }), {
        headers: { "Content-Type": "application/json" },
        status: 201,
    });
}
