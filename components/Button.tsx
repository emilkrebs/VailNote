import { JSX } from 'preact';

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			class='w-full mt-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition-colors'
		/>
	);
}
