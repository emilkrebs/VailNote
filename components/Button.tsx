import { JSX } from 'preact';

interface ButtonProps extends JSX.ButtonHTMLAttributes {
	variant?: 'primary' | 'secondary' | 'danger';
}

export function Button(props: ButtonProps) {
	return (
		<button
			{...props}
			class={`button ${
				props.variant === 'primary'
					? 'button-primary'
					: props.variant === 'secondary'
					? 'button-secondary'
					: props.variant === 'danger'
					? 'button-danger'
					: 'button-primary'
			} ${props.class ?? ''}`}
		>
			{props.children}
		</button>
	);
}
