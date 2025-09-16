import Header from '../components/Header.tsx';
import CreateNote from '../islands/CreateNoteForm.tsx';
import { ORIGIN } from '../lib/types/common.ts';
import SiteHeader from '../components/SiteHeader.tsx';

export default function Home() {
    return (
        <>
            <Header
                title='Secure Encrypted Note Sharing'
                description='Share encrypted notes securely with VailNote. Open-source note sharing with end-to-end encryption, automatic deletion, and privacy-preserving features. No tracking, maximum security.'
                canonicalUrl={ORIGIN}
            />
            <main class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-8 md:py-16'>
                <SiteHeader />

                <section
                    class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-2 md:px-4 py-4 md:py-8'
                    aria-label='Create Note Form'
                >
                    <CreateNote />
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
                <article class='feature-card group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-3 transition-all duration-500 ease-out'>
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
                            Your notes are encrypted in your browser using AES-256 before transmission. Even we can't
                            read your content – true zero-knowledge architecture ensures maximum privacy.
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

                <article class='feature-card group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/25 transform hover:-translate-y-3 transition-all duration-500 ease-out'>
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
                            Fully transparent and auditable code. Contribute, inspect, or self-host – you have complete
                            control and visibility into how your data is handled.
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

                <article class='feature-card group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-3 transition-all duration-500 ease-out'>
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
                            No tracking, no data collection. Your notes auto-delete after expiration, and we never store
                            personal information or browsing patterns.
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
                        Use VailNote for secure, private note sharing. Start protecting your sensitive information
                        today.
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
