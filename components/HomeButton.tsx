import { JSX } from 'preact';

export default function HomeButton(props: JSX.AnchorHTMLAttributes) {
	return (
		<a
			href='/'
			class={`button button-primary ${props.class ?? ''}`}
		>
			Go Back Home
		</a>
	);
}
