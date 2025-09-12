export default function SiteHeader() {
    return (
        <header class='text-center relative'>
            <div class='relative z-10'>
                <h1 class='text-5xl md:text-7xl lg:text-8xl font-bold text-white filter drop-shadow-lg'>
                    <a href='/'>VailNote</a>
                </h1>

                {/* Trust indicators */}
                <div class='flex flex-wrap justify-center gap-6 mt-8 text-sm'>
                    <div class='flex items-center text-blue-300 bg-blue-900/20 px-3 py-2 rounded-full border border-blue-700/30'>
                        <svg class='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
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
    );
}
