import { noteDatabase } from "../../database/db.ts";
import { formatExpiration, Note } from "../../types/types.ts";


/* used for client side note creation and encryption
*/
export const handler = async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
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
