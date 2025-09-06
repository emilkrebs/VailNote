import { JSX } from 'preact/jsx-runtime';

export default function Card({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			class={`bg-gradient-to-br from-gray-800/95 to-gray-700/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-600/50 ${
				props.class || ''
			}`}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardHeader({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) {
	return (
		<div class={`flex flex-col space-y-2 p-4 sm:p-8 ${props.class ?? ''}`} {...props}>
			{children}
		</div>
	);
}

export function CardTitle({ children, ...props }: JSX.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2 class={`text-3xl font-bold ${props.class || ''}`} {...props}>
			{children}
		</h2>
	);
}

export function CardContent({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) {
	return (
		<div class={`p-4 sm:p-8 !pt-0 ${props.class || ''}`} {...props}>
			{children}
		</div>
	);
}

export function CardFooter({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) {
	return (
		<div class={`p-4 sm:p-8 border-t border-gray-600/50 ${props.class || ''}`} {...props}>
			{children}
		</div>
	);
}
