import { JSX } from 'preact';

export default function HomeButton(props: JSX.AnchorHTMLAttributes) {
	return (
		<a
			href='/'
			class={`px-4 py-3 rounded-xl font-semibold text-center text-lg shadow-lg transition-colors bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/30 ${
				props.class ?? ''
			}`}
		>
			Go Back Home
		</a>
	);
}
