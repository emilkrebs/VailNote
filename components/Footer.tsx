import { asset } from "$fresh/runtime.ts";

export default function Footer() {
    return (
        <footer class="bg-gray-800 text-white py-4">
            <div class="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
                <div class="mb-2 md:mb-0 text-center md:text-left">
                    <p class="text-sm text-gray-300">
                        &copy; {new Date().getFullYear()} <span class="font-semibold">VailNote</span>. All rights reserved.
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <a
                        href="https://github.com/emilkrebs/VailNote"
                        title="Source Code"
                        class="hover:scale-110 transition-transform"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img src={asset("/icons/github_logo.svg")} class="w-6 h-6" alt="GitHub" />
                    </a>
                    <span class="text-gray-400">|</span>
                    <span class="text-sm">
                        Made with <span class="text-red-400">❤️</span> by{" "}
                        <a
                            href="https://emilkrebs.dev/"
                            class="underline hover:text-blue-300 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Emil Krebs
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}