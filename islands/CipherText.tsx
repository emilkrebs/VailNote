import { useEffect, useState } from 'preact/hooks';

const GLYPHS = 'ABCDEFabcdef0123456789+/=';

/**
 * Renders text that resolves out of ciphertext-like glyphs once after hydration.
 * Motivation: storytelling; it shows decryption instead of claiming it. Used at most
 * once per page. Server-side (and under prefers-reduced-motion) it is plain text.
 */
export default function CipherText({ text, class: className }: { text: string; class?: string }) {
    const [display, setDisplay] = useState(text);

    useEffect(() => {
        if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

        const totalFrames = 32;
        let frame = 0;
        const interval = setInterval(() => {
            frame++;
            const resolved = Math.floor((frame / totalFrames) * text.length);
            let scrambled = text.slice(0, resolved);
            for (let i = resolved; i < text.length; i++) {
                scrambled += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            setDisplay(scrambled);
            if (frame >= totalFrames) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);
    }, [text]);

    return <span class={className} aria-label={text}>{display}</span>;
}
