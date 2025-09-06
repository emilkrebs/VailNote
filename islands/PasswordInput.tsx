import { asset } from '$fresh/runtime.ts';
import { useState } from 'preact/hooks';
import { JSX } from 'preact';
import { FormField, Input } from '../components/Form.tsx';

interface PasswordInputProps extends JSX.InputHTMLAttributes {
	error?: string;
	helpText?: string;
}

export default function PasswordInput(
	props: PasswordInputProps,
) {
	const [isHidden, setIsHidden] = useState(true);

	return (
		<FormField class='relative w-full'>
			<input
				{...props}
				class={`input ${props.class || ''}`}
				type={isHidden ? 'password' : 'text'}
			/>
			<button
				type='button'
				class='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
				onClick={() => setIsHidden(!isHidden)}
			>
				<span title={isHidden ? 'Show' : 'Hide'}>
					<img
						src={isHidden ? asset('/icons/visibility.svg') : asset('/icons/visibility_off.svg')}
						alt={isHidden ? 'Show' : 'Hide'}
						class='fill-white'
					/>
				</span>
			</button>
		</FormField>
	);
}
