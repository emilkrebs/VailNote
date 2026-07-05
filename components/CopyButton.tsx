import { useState } from 'preact/hooks';
import { CheckIcon, CopyIcon } from './Icons.tsx';

export default function CopyButton({ value, label = 'Copy to clipboard' }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    return (
        <button
            type='button'
            onClick={handleCopy}
            class='shrink-0 p-2 rounded-control cursor-pointer text-muted hover:text-ink hover:bg-raised transition-colors duration-150'
            title={label}
            aria-label={copied ? 'Copied' : label}
        >
            {copied ? <CheckIcon size={18} class='text-ok' /> : <CopyIcon size={18} />}
        </button>
    );
}
