import { JSX } from 'preact';

interface MessageProps extends JSX.HTMLAttributes<HTMLDivElement> {
	visible?: boolean;
	variant?: 'success' | 'error' | 'info';
}

export default function Message({ visible = true, variant = 'info', children, class: className }: MessageProps) {
	const baseClasses = 'p-4 rounded-xl shadow-md border transition-all duration-300';
	const variantClasses = {
		success: 'bg-green-600/20 border-green-400 text-green-200 shadow-green-500/20',
		error: 'bg-red-600/20 border-red-400 text-red-200 shadow-red-500/20',
		info: 'bg-blue-600/20 border-blue-400 text-blue-200 shadow-blue-500/20',
	};
	return (
		<>
			{visible && (
				<div
					class={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
				>
					{children}
				</div>
			)}
		</>
	);
}
