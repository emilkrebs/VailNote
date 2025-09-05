import { useState } from 'preact/hooks';
import { JSX } from 'preact';

type CopyContentProps = {
	content: string;
	label: string;
};

export default function CopyContent(
	{ content, label }: CopyContentProps,
): JSX.Element {
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
		<button
			type='button'
			onClick={handleCopy}
			disabled={copied}
			class='cursor-pointer mt-2 flex items-center gap-3 border-2 border-blue-500 rounded-lg p-3 bg-blue-600/20 text-blue-300'
		>
			<span
				class='min-w-0 whitespace-nowrap overflow-scroll w-full scrollbar-hidden'
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
						class='text-green-300'
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
						class='text-blue-300'
					>
						<rect x='9' y='9' width='13' height='13' rx='2' />
						<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
					</svg>
				)}
		</button>
	);
}
