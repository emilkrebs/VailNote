import { Handlers, PageProps } from "$fresh/server.ts";
import { noteDatabase } from "../database/db.ts";
import CopyContent from "../islands/CopyContent.tsx";
import PasswordInput from "../islands/PasswordInput.tsx";
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
        createdAt: new Date(),
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


        <div class="mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600">
          <h2 class="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5H4v-3L16.5 3.5z" />
            </svg>
            Create a Note
          </h2>
          <p class="mt-1 text-gray-300 text-base">
            Share your notes securely with a password. Notes are <span class="font-semibold text-blue-300">encrypted and self-destruct</span> after a set time.
          </p>
          
          {data.message && (
            <div class={`mt-6 p-4 rounded-lg border transition-all ${data.noteId
              ? "bg-green-600/20 border-green-400 text-green-200"
              : "bg-red-600/20 border-red-400 text-red-200"
              }`}>
              <span class="font-medium">{data.message}</span>

              {data.noteId && (
                 <CopyContent content={data.noteLink} label={data.noteLink} />
              )}
            </div>
          )}

          <div class="mt-8">
            <CreateNoteForm />
          </div>
        </div>
      </div>
    </div>
  );
}



function CreateNoteForm() {
  return (
    <form class="mt-4 space-y-5" method="post">
      <div>
        <label class="block text-white text-lg font-semibold mb-2" htmlFor="noteContent">
          Note
        </label>
        <textarea
          class="w-full h-32 p-3 border bord</button>er-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition"
          placeholder="Type your note here..."
          name="noteContent"
          id="noteContent"
          required
        ></textarea>
      </div>

      <div>
        <label class="block text-white text-lg font-semibold mb-2" htmlFor="notePassword" title="Set a password to protect and encrypt your note">
          Password <span class="text-gray-400 font-normal text-base">(optional)</span>
        </label>
        <PasswordInput
          type="password"
          name="notePassword"
          id="notePassword"
          placeholder="Enter to set a password"
        />
      </div>

      <div>
        <label class="block text-white text-lg font-semibold mb-2" htmlFor="expiresIn">
          Destroy After
        </label>
        <select
          name="expiresIn"
          id="expiresIn"
          class="w-full p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition"
          defaultValue="24h"
        >
          <option value="10m">10 minutes</option>
          <option value="1h">1 hour</option>
          <option value="6h">6 hours</option>
          <option value="12h">12 hours</option>
          <option value="24h">24 hours</option>
          <option value="3d">3 days</option>
          <option value="7d">7 days</option>
        </select>
      </div>

      <button
        type="submit"
        class="w-full mt-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-colors"
      >
        Save Note
      </button>
    </form>
  );
}