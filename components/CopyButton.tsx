import { useState } from 'preact/hooks';

export default function CopyButton({ value }: { value: string }) {
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
            class='flex-shrink-0 p-2 cursor-pointer text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-all duration-200'
            title='Copy to clipboard'
        >
            {copied
                ? (
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        class='text-green-400'
                    >
                        <path d='M5 12l5 5L20 7' />
                    </svg>
                )
                : (
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <rect x='9' y='9' width='13' height='13' rx='2' />
                        <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
                    </svg>
                )}
        </button>
    );
}
