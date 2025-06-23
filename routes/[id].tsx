import { Handlers, PageProps } from "$fresh/server.ts";
import { noteDatabase } from "../database/db.ts";
import { Note } from "../types/types.ts";
import { compareHash, generateHash } from "../utils/hashing.ts";
import PasswordInput from "../islands/PasswordInput.tsx";
import { decryptNoteContent } from "../utils/encryption.ts";
import Header from "../components/Header.tsx";
import PenIcon from "../components/PenIcon.tsx";

interface NotePageProps {
    note?: Note;
    passwordRequired?: boolean;

    message?: string;
}

export const handler: Handlers<NotePageProps> = {
    async GET(_req, ctx) {
        const { id } = ctx.params;
        const url = new URL(_req.url);
        const firstAuth = url.searchParams.get("auth");

        const note = await noteDatabase.getNoteById(id);

        if (!note) {
            return ctx.renderNotFound();
        }

        if (note.password) {
            return ctx.render({
                note,
                passwordRequired: true,
                message: "This note is private and requires a password to view.",
            });
        }

        try {
            const decryptedNote: Note = {
                ...note,
                content: await decryptNoteContent(note.content, note.iv, firstAuth || note.id),
            };

            await noteDatabase.deleteNote(id);

            return ctx.render({
                note: decryptedNote,
                passwordRequired: false,
                message: "This note has been destroyed. It will not be retrievable again.",
            });
        }
        catch (error) {
            return ctx.render({
                passwordRequired: false,
                message: "Failed to decrypt note content. It may have been tampered with or is invalid.",
            });
        }
    },
    async POST(req, ctx) {
        const { id } = ctx.params;
        const formData = await req.formData();
        const password = formData.get("password") as string;
        const passwordHash = await generateHash(password);

        const note = await noteDatabase.getNoteById(id);
        if (!note || !note.password) {
            return ctx.renderNotFound();
        }

        if (await compareHash(passwordHash, note.password)) {
            return ctx.render({
                note: note,
                passwordRequired: true,
                message: "Incorrect password. Please try again."
            });
        }
        const result: Note = {
            ...note,
            content: await decryptNoteContent(note.content, note.iv, password)
        };

        await noteDatabase.deleteNote(id);

        return ctx.render({
            note: result,
            passwordRequired: false,
            message: "This note has been destroyed. It will not be retrievable again.",
        });
    }
};

export default function NotePage(ctx: PageProps<NotePageProps>) {
    const { note, passwordRequired, message } = ctx.data;

    if (!note) {
        return (
            <>
                <Header title={`Note Not Found`} />
                <div class="flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16">
                    <h1 class="text-4xl font-bold">VailNote</h1>
                    <p class="mt-2 text-lg text-gray-200">Open-Source, Encrypted Note Sharing</p>
                    <div class="flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8">
                        <div class="flex flex-col gap-2 mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600">
                            <h2 class="text-3xl font-bold text-white mb-2">Note Not Found</h2>
                            <p class="text-gray-300">{message || "The note you are looking for does not exist."}</p>

                            <a href="/" class="w-fit mt-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-colors">
                                Go Back Home
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (passwordRequired) {
        return (
            <>
                <Header title={`Password Protected`} />
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
                                Enter Password
                            </h2>
                            <p class="mt-1 text-gray-300 text-base">{message}</p>
                            <form method="POST" class="mt-8 space-y-5">
                                <div>
                                    <label class="block text-white text-lg font-semibold mb-2" htmlFor="password">
                                        Password
                                    </label>
                                    <PasswordInput
                                        type="password"
                                        name="password"
                                        id="password"
                                        placeholder="Enter password to view note"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    class="w-full mt-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition"
                                >
                                    View Note
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title={`View Note`} />
            <div class="flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16">
                <h1 class="text-4xl font-bold">VailNote</h1>
                <p class="mt-2 text-lg text-gray-200">Open-Source, Encrypted Note Sharing</p>
                <div class="flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8">
                    <div class="flex flex-col gap-2 mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600">

                        <h2 class="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                            <PenIcon />
                            Note Details
                        </h2>

                        {message && (
                            <div class={`p-4 rounded-lg border transition-all ${note.id
                                ? "bg-green-600/20 border-green-400 text-green-200"
                                : "bg-red-600/20 border-red-400 text-red-200"
                                }`}>
                                <span class="font-medium">{message}</span>
                            </div>
                        )}

                        <h2 class="text-xl font-semibold text-white mt-2">
                            Content
                        </h2>
                        <div class="bg-gray-900 rounded p-4 shadow-inner">
                            <p class="mb-2 whitespace-pre-wrap break-words text-white">{note.content}</p>
                        </div>

                        <a href="/" class="w-fit mt-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-colors">
                            Go Back Home
                        </a>

                    </div>
                </div>
            </div>
        </>
    );
}