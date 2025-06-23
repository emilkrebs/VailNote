import { Handlers, PageProps } from "$fresh/server.ts";
import { noteDatabase } from "../database/db.ts";
import CreateNote from "../islands/CreateNoteForm.tsx";
import { formatExpiration } from "../types/types.ts";
import { encryptNoteContent } from "../utils/encryption.ts";
import { generateHash } from "../utils/hashing.ts";


export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render({ message: "" });
  },
  async POST(req, ctx) {
    const form = await req.formData();
    const noteContent = form.get("noteContent") as string;
    const password = form.get("notePassword") as string;
    const expiresIn = form.get("expiresIn") as string;

    if (!noteContent || noteContent.trim() === "") {
      return ctx.render({ message: "Please enter a note." });
    }

    try {
      const noteId = await noteDatabase.generateNoteId();
      const { encrypted, iv } = await encryptNoteContent(noteContent, password ? password : noteId);

      await noteDatabase.insertNote({
        id: noteId,
        content: encrypted,
        expiresAt: formatExpiration(expiresIn),
        password: password ? await generateHash(password) : undefined,
        iv: iv,
      });

      return ctx.render({ message: "Note saved successfully!", noteId: noteId, noteLink: `${ctx.url}${noteId}` });
    } catch (_err) {
      return ctx.render({ message: "Failed to save note. Please try again later.", noteId: null, noteLink: "" });
    }
  },
};

export default function Home({ data }: PageProps) {
  return (
    <div class="flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16">

      <h1 class="text-4xl font-bold">VailNote</h1>
      <p class="mt-2 text-lg text-gray-200">Open-Source, Encrypted Note Sharing</p>

      <div class="flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8">
        <CreateNote data={data} />
      </div>
    </div>
  );
}



