import { Handlers, PageProps } from '$fresh/server.ts';
import Header from '../components/Header.tsx';
import CreateNote from '../islands/CreateNoteForm.tsx';
import { formatExpiration } from '../types/types.ts';
import { encryptNoteContent } from '../utils/encryption.ts';
import { generateHash, generateSHA256Hash } from '../utils/hashing.ts';
import { generateRateLimitHeaders } from '../utils/rate-limiting/rate-limit-headers.ts';
import { State } from './_middleware.ts';

interface HomeData {
	message: string;
	noteId?: string | null;
	noteLink?: string;
}

export const handler: Handlers<HomeData, State> = {
	GET(_req, ctx) {
		return ctx.render({ message: '' });
	},
	async POST(req, ctx) {
		// this endpoint is only used to create a note when the client does not have JavaScript enabled
		const rateLimitResult = await ctx.state.context.getRateLimiter().checkRateLimit(req);
		const noteDatabase = ctx.state.context.getNoteDatabase();
		if (!rateLimitResult.allowed) {
			return ctx.render({
				message: 'Rate limit exceeded. Please try again later in a few minutes.',
				noteId: null,
				noteLink: '',
			}, {
				headers: generateRateLimitHeaders(rateLimitResult),
			});
		}

		const form = await req.formData();
		const noteContent = form.get('noteContent') as string;
		const password = form.get('notePassword') as string; // the plain password is never submitted to the server
		const expiresIn = form.get('expiresIn') as string;
		const passwordSHA256 = await generateSHA256Hash(password);

		if (!noteContent || noteContent.trim() === '') {
			return ctx.render({ message: 'Please enter a note.' });
		}

		const noteId = await noteDatabase.generateNoteId();

		// encrypt note content using the provided plain password or a random auth token
		const encryptedContent = await encryptNoteContent(
			noteContent,
			password ? password : noteId,
		);

		const insertResult = await noteDatabase.insertNote({
			id: noteId,
			content: encryptedContent.encrypted,
			expiresAt: formatExpiration(expiresIn),
			password: password ? await generateHash(passwordSHA256) : undefined, // Password should be hashed with SHA-256 before sending and is not used for encryption
			iv: encryptedContent.iv,
		});

		if (!insertResult.success) {
			return ctx.render({
				message: `Failed to save note: ${insertResult.error}`,
				noteId: null,
				noteLink: '',
			});
		}

		return ctx.render({
			message: 'Note saved successfully!',
			noteId: noteId,
			noteLink: `${ctx.url}${noteId}`,
		});
	},
};

export default function Home({ data }: PageProps) {
	return (
		<>
			<Header
				title='Secure Encrypted Note Sharing'
				description='Share encrypted notes securely with VailNote. Open-source note sharing with end-to-end encryption, automatic deletion, and privacy-preserving features. No tracking, maximum security.'
				canonicalUrl='https://vailnote.com'
			/>
			<main class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-8 md:py-16'>
				<header class='text-center relative'>
					<div class='relative z-10'>
						<h1 class='text-5xl md:text-7xl lg:text-8xl font-bold text-white filter drop-shadow-lg'>
							VailNote
						</h1>

						{/* Trust indicators */}
						<div class='flex flex-wrap justify-center gap-6 mt-8 text-sm'>
							<div class='flex items-center text-blue-300 bg-blue-900/20 px-3 py-2 rounded-full border border-blue-700/30'>
								<svg class='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								End-to-End Encrypted
							</div>
							<div class='flex items-center text-green-300 bg-green-900/20 px-3 py-2 rounded-full border border-green-700/30'>
								<svg class='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								100% Open Source
							</div>
							<div class='flex items-center text-purple-300 bg-purple-900/20 px-3 py-2 rounded-full border border-purple-700/30'>
								<svg class='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z'
										clip-rule='evenodd'
									>
									</path>
									<path d='M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z'>
									</path>
								</svg>
								No Tracking
							</div>
						</div>
					</div>
				</header>

				<section
					class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-2 md:px-4 py-4 md:py-8'
					aria-label='Create Note Form'
				>
					<CreateNote data={data} />
				</section>

				<FeaturesSection />
			</main>
		</>
	);
}

function FeaturesSection() {
	return (
		<section class='my-16 px-4 text-center max-w-6xl mx-auto' aria-labelledby='features-heading'>
			<h2
				id='features-heading'
				class='mb-20 text-4xl md:text-5xl lg:text-6xl font-black text-center text-white drop-shadow-2xl hover:scale-105 transition-transform duration-300 cursor-default'
			>
				Why Choose VailNote?

				<div class='bg-white/40 h-px w-24 mx-auto my-8 rounded-full'></div>
			</h2>

			<div class='flex flex-col md:flex-row gap-4 text-left'>
				<article class='feature-card group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-3 transition-all duration-500 ease-out overflow-hidden'>
					{/* Background accent */}
					<div class='absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500'>
					</div>

					<div class='relative z-10'>
						<div class='flex items-center mb-6'>
							<div class='p-4 bg-blue-500/20 rounded-xl mr-5 group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300'>
								<span class='text-3xl' role='img' aria-label='Lock icon'>🔒</span>
							</div>
							<div>
								<h3 class='text-xl font-bold text-blue-300 group-hover:text-blue-200 transition-colors duration-300 mb-1'>
									End-to-End Encryption
								</h3>
								<p class='text-sm text-blue-400/70 font-medium'>AES-256 Standard</p>
							</div>
						</div>
						<p class='text-gray-300 leading-relaxed mb-6'>
							Your notes are encrypted in your browser using AES-256 before transmission. Even we can't read your
							content – true zero-knowledge architecture ensures maximum privacy.
						</p>
						<div class='space-y-2'>
							<div class='flex items-center text-sm text-blue-400'>
								<svg class='w-4 h-4 mr-2 text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								Client-side encryption
							</div>
							<div class='flex items-center text-sm text-blue-400'>
								<svg class='w-4 h-4 mr-2 text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								Zero-knowledge architecture
							</div>
						</div>
					</div>
				</article>

				<article class='feature-card group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/25 transform hover:-translate-y-3 transition-all duration-500 ease-out overflow-hidden'>
					{/* Background accent */}
					<div class='absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all duration-500'>
					</div>

					<div class='relative z-10'>
						<div class='flex items-center mb-6'>
							<div class='p-4 bg-green-500/20 rounded-xl mr-5 group-hover:bg-green-500/30 group-hover:scale-110 transition-all duration-300'>
								<span class='text-3xl' role='img' aria-label='Rocket icon'>🚀</span>
							</div>
							<div>
								<h3 class='text-xl font-bold text-green-300 group-hover:text-green-200 transition-colors duration-300 mb-1'>
									Open-Source
								</h3>
								<p class='text-sm text-green-400/70 font-medium'>MIT Licensed</p>
							</div>
						</div>
						<p class='text-gray-300 leading-relaxed mb-6'>
							Fully transparent and auditable code. Contribute, inspect, or self-host – you have complete control and
							visibility into how your data is handled.
						</p>
						<div class='space-y-2'>
							<div class='flex items-center text-sm text-green-400'>
								<svg class='w-4 h-4 mr-2 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								100% transparent code
							</div>
							<div class='flex items-center text-sm text-green-400'>
								<svg class='w-4 h-4 mr-2 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								Self-hosting ready
							</div>
						</div>
					</div>
				</article>

				<article class='feature-card group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-3 transition-all duration-500 ease-out overflow-hidden'>
					{/* Background accent */}
					<div class='absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-500'>
					</div>

					<div class='relative z-10'>
						<div class='flex items-center mb-6'>
							<div class='p-4 bg-purple-500/20 rounded-xl mr-5 group-hover:bg-purple-500/30 group-hover:scale-110 transition-all duration-300'>
								<span class='text-3xl' role='img' aria-label='Shield icon'>🛡️</span>
							</div>
							<div>
								<h3 class='text-xl font-bold text-purple-300 group-hover:text-purple-200 transition-colors duration-300 mb-1'>
									Privacy First
								</h3>
								<p class='text-sm text-purple-400/70 font-medium'>Zero Tracking</p>
							</div>
						</div>
						<p class='text-gray-300 leading-relaxed mb-6'>
							No tracking, no data collection. Your notes auto-delete after expiration, and we never store personal
							information or browsing patterns.
						</p>
						<div class='space-y-2'>
							<div class='flex items-center text-sm text-purple-400'>
								<svg class='w-4 h-4 mr-2 text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								No data collection
							</div>
							<div class='flex items-center text-sm text-purple-400'>
								<svg class='w-4 h-4 mr-2 text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fill-rule='evenodd'
										d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
										clip-rule='evenodd'
									>
									</path>
								</svg>
								Auto-expiring notes
							</div>
						</div>
					</div>
				</article>
			</div>

			<div class='mt-16 p-8 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-green-900/40 rounded-2xl border border-blue-700/50 backdrop-blur-sm'>
				<div class='text-center'>
					<h3 class='text-2xl font-bold text-gray-200 mb-3'>
						Ready for secure data sharing?
					</h3>
					<p class='text-gray-400 text-lg mb-6 max-w-2xl mx-auto'>
						Use VailNote for secure, private note sharing. Start protecting your sensitive information today.
					</p>
					<div class='flex flex-wrap justify-center gap-6 text-sm'>
						<div class='flex items-center text-blue-300'>
							<svg class='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
								<path
									fill-rule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
									clip-rule='evenodd'
								>
								</path>
							</svg>
							Free forever
						</div>
						<div class='flex items-center text-green-300'>
							<svg class='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
								<path
									fill-rule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
									clip-rule='evenodd'
								>
								</path>
							</svg>
							No registration required
						</div>
						<div class='flex items-center text-purple-300'>
							<svg class='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
								<path
									fill-rule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
									clip-rule='evenodd'
								>
								</path>
							</svg>
							Instant sharing
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
