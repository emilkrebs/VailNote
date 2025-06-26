import { asset } from '$fresh/runtime.ts';
import { useState } from 'preact/hooks';
import { JSX } from 'preact';

export default function PasswordInput(
	props: JSX.IntrinsicElements['input'],
) {
	const [isHidden, setIsHidden] = useState(true);

	return (
		<div class='relative w-full'>
			<input
				{...props}
				type={isHidden ? 'password' : 'text'}
				class='w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
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
		</div>
	);
}
