import { Button } from "../components/Button.tsx";
import { encryptNoteContent } from "../utils/encryption.ts";
import { useState } from "preact/hooks";
import CopyContent from "./CopyContent.tsx";
import PasswordInput from "./PasswordInput.tsx";
import PenIcon from "../components/PenIcon.tsx";


interface CreateNoteData {
    message: string;
    noteId?: string;
    noteLink?: string;
}

interface CreateNoteFormProps {
    onCreate: (noteId: string, message: string, noteLink: string) => void;
    onError: (error: string) => void;
}

export default function CreateNote({ data }: { data: CreateNoteData }) {
    const [formData, setFormData] = useState<CreateNoteData>({ ...data });

    return (
        <div class="mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600">
            <h2 class="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <PenIcon />
                Create a Note
            </h2>

            <p class="mt-1 text-gray-300 text-base">
                Share your notes securely with a password. Notes are <span class="font-semibold text-blue-300">encrypted</span> and <span class="font-semibold text-blue-300">self-destruct</span> after a set time or after being viewed.
            </p>

            {formData.message && (
                <div class={`mt-6 p-4 rounded-lg border transition-all ${formData.noteId
                    ? "bg-green-600/20 border-green-400 text-green-200"
                    : "bg-red-600/20 border-red-400 text-red-200"
                    }`}>
                    <span class="font-medium">{formData.message}</span>

                    {formData.noteId && (
                        <CopyContent content={formData.noteLink!} label={formData.noteLink!} />
                    )}
                </div>
            )}

            <div class="mt-8">
                <CreateNoteForm onCreate={(id, message, noteLink) => {
                    setFormData({ message, noteId: id, noteLink });

                }} onError={(error) => {
                    setFormData({ message: error, noteId: undefined, noteLink: "" });
                }} />
            </div>
        </div>
    );
}

function CreateNoteForm({ onCreate, onError }: CreateNoteFormProps) {
    async function hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        // Convert ArrayBuffer to base64 string
        return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const noteContent = formData.get("noteContent")?.toString() || "";
        const notePassword = formData.get("notePassword")?.toString() || "";
        const expiresIn = formData.get("expiresIn")?.toString() || "";
        const replaceContent = formData.get("replaceContent")?.toString() || "";

        try {
            const encryptedContent = await encryptNoteContent(noteContent, notePassword);
            const requestBody = {
                content: encryptedContent.encrypted,
                password: notePassword ? await hashPassword(notePassword) : null,
                expiresAt: expiresIn,
                iv: encryptedContent.iv,
                replaceContent: replaceContent || undefined,
            };

            const response = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();
            if (response.ok) {
                onCreate(result.noteId, result.message, result.noteLink);
                form.reset();
            } else {
                onError(result.error || "Failed to create note.");
            }
        } catch (err) {
            onError("An error occurred while creating the note.");
        }
    }


    return (
        <form class="mt-4 space-y-5" method="post" onSubmit={handleSubmit}>
            <div>
                <label class="block text-white text-lg font-semibold mb-2" htmlFor="noteContent">
                    Note
                </label>
                <textarea
                    class="w-full h-52 p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition"
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
                <label class="block text-white text-lg font-semibold" htmlFor="expiresIn">
                    Expire After
                    <span class="text-gray-400 font-normal text-sm"> - Note will self-destruct after this time</span>
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

            {/* Advanced options 
            <details class="mt-4 bg-gray-800 rounded-lg p-4">
                <summary class="cursor-pointer text-white font-semibold">
                    Advanced Options
                </summary>
                <div class="mt-2 space-y-3">
                    <div>
                        <label class="block text-white text-lg font-semibold" htmlFor="replaceContent">
                            Replace Content (Silent Destruction)
                        </label>
                        <p class="text-gray-400 text-sm mb-2">
                            This option allows you to replace the content of the note with other content after the note has been viewed. This is useful to ensure noone else knows the content of the note has been viewed.
                        </p>
                        <textarea
                            name="replaceContent"
                            id="replaceContent"
                            class="w-full h-32 p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition"
                            placeholder="Enter new content here..."
                        ></textarea>
                    </div>
                </div>
            </details>
*/}
            <Button
                type="submit"
            >
                Save Note
            </Button>
            <noscript>
                <p class="mt-1 text-red-500 text-base">
                    ⚠ You have JavaScript disabled. Notes will now be encrypted on the server side. Enable JavaScript for client-side encryption.
                </p>
            </noscript>
            <div class="mt-4 text-sm text-gray-400">
                <p>
                    Notes are encrypted with AES-256 and can be protected with a password. They will self-destruct after the specified time or after being viewed.
                </p>
                <p>
                    <span class="font-semibold">Note:</span> If you set a password, the password will be used to encrypt the note content. If you do not set a password, the note will be encrypted with a unique id.
                </p>
            </div>
        </form>
    );
}
