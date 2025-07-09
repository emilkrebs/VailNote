import { JSX } from 'preact';

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
	color?: 'primary' | 'secondary' | 'danger';
}

export function Button(props: ButtonProps) {
	const baseClasses = 'px-4 py-3 rounded-xl font-semibold text-lg shadow-lg transition-color';

	const primaryClasses =
		'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/30';
	const secondaryClasses =
		'bg-gradient-to-r from-gray-500 to-gray-700 text-white hover:from-gray-600 hover:to-gray-800 focus:ring-4 focus:ring-gray-500/30';
	const dangerClasses =
		'bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 focus:ring-4 focus:ring-red-500/30';

	return (
		<button
			{...props}
			class={`${baseClasses} ${
				props.color === 'primary'
					? primaryClasses
					: props.color === 'secondary'
					? secondaryClasses
					: props.color === 'danger'
					? dangerClasses
					: ''
			} ${props.class}`}
		>
			{props.children}
		</button>
	);
}
