import { useState } from 'preact/hooks';

type CopyContentProps = {
	content: string;
	label: string;
};

export default function CopyContent(
	{ content, label }: CopyContentProps,
) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (_e) {
			setCopied(false);
		}
	};

	return (
		<div
			onClick={handleCopy}
			role='button'
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleCopy();
				}
			}}
			aria-label={label}
			class='relative cursor-pointer border p-4 rounded bg-green-500/10 hover:bg-green-500/20 transition-colors overflow-hidden min-w-0 w-full max-w-full flex items-center'
		>
			{/* single-line truncation with reserved icon space */}
			<span
				class='flex-1 min-w-0 truncate text-sm pr-8'
				title={label}
			>
				{copied ? 'Copied!' : label}
			</span>
			{copied
				? (
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='24'
						height='24'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='1.5'
						strokeLinecap='round'
						strokeLinejoin='round'
						class='text-green-300 absolute top-2 right-2 pointer-events-none'
					>
						<path d='M5 12l5 5L20 7' />
					</svg>
				)
				: (
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='24'
						height='24'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='1.5'
						strokeLinecap='round'
						strokeLinejoin='round'
						class='text-blue-300 absolute top-2 right-2 pointer-events-none'
					>
						<rect x='9' y='9' width='13' height='13' rx='2' />
						<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
					</svg>
				)}
		</div>
	);
}
