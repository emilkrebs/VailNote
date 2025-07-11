import { JSX } from 'preact';

export default function Select(props: JSX.HTMLAttributes<HTMLSelectElement>) {
	return (
		<select
			class='w-full p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition'
			{...props}
		>
		</select>
	);
}
