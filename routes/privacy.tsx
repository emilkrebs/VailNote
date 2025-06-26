import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';

export default function Privacy() {
	return (
		<>
			<Header title='Privacy Policy' />
			<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
				<h1 class='text-4xl font-bold mb-2'>Privacy Policy</h1>
				<p class='mt-2 text-lg text-gray-200'>
					Your privacy and security are our top priorities.
				</p>
				<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8 gap-8'>
					<div class='p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
						<h2 class='text-2xl font-bold text-white mb-4'>
							How VailNote Protects Your Data
						</h2>
						<ul class='list-disc pl-6 text-gray-300 space-y-2 mb-6'>
							<li>
								All notes are <span class='text-blue-300 font-semibold'>encrypted</span>{' '}
								in your browser before being sent to our servers if JavaScript is enabled.
							</li>
							<li>
								If JavaScript is disabled, the encryption happens on the server side, but you must trust us to handle
								your data securely.
							</li>
							<li>
								We never store your password or encryption key. Only you can decrypt your notes.
							</li>
							<li>
								Notes are automatically deleted after being viewed or after their expiration time.
							</li>
							<li>
								We do not use cookies or trackers for advertising or analytics.
							</li>
						</ul>
						<h4 id='note-on-javascript-usage' class='text-lg font-semibold text-white mt-4'>
							Note on JavaScript Usage
						</h4>
						<p class='text-gray-300 mb-4'>
							When JavaScript is enabled, your notes are encrypted in your browser before being sent to our servers.
							This means that even if you disable JavaScript, your notes will still be encrypted, but the encryption
							will happen on the server side. In this case, you must trust us to handle your data securely.
						</p>

						<h3 class='text-xl font-semibold text-white mb-2'>
							Zero-Knowledge Guarantee
						</h3>
						<p class='text-gray-300 mb-4'>
							VailNote is designed so that even our team cannot access your note contents. All encryption and decryption
							happens on your device.
						</p>
						<h3 class='text-xl font-semibold text-white mb-2'>Contact</h3>
						<p class='text-gray-300'>
							If you have questions about privacy, contact me at{' '}
							<a
								href='mailto:emil.krebs@outlook.de'
								class='text-blue-400 underline'
							>
								emil.krebs@outlook.de
							</a>.
						</p>
						<h3 class='text-xl font-semibold text-white mt-6'>
							Changes to this Policy
						</h3>
						<p class='text-gray-300'>
							We may update this policy in the future. Please check back periodically for changes.
						</p>

						<p class='font-bold text-white mt-2'>
							The source code can be found on{' '}
							<a
								href='https://github.com/emilkrebs/VailNote'
								class='text-blue-400 underline'
							>
								GitHub
							</a>.
						</p>
					</div>
				</div>
			</div>
		</>
	);
}
