import { JSX } from 'preact';

export default function HomeButton(props: JSX.AnchorHTMLAttributes) {
	return (
		<a
			href='/'
			class={`inline-flex items-center button button-secondary ${props.class ?? ''}`}
		>
			<svg
				class='w-4 h-4 mr-2'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<path
					stroke-linecap='round'
					stroke-linejoin='round'
					stroke-width='2'
					d='M15 19l-7-7 7-7'
				/>
			</svg>
			Home
		</a>
	);
}
