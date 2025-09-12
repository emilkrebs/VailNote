export default function Footer() {
    const links = [
        {
            href: 'https://emilkrebs.dev/imprint',
            label: 'Imprint',
        },
        {
            href: '/privacy',
            label: 'Privacy Policy',
        },
        {
            href: '/terms',
            label: 'Terms of Service',
        },
        {
            href: 'https://github.com/emilkrebs/VailNote/wiki',
            label: 'Wiki',
            external: true,
        },
    ];

    return (
        <footer class='bg-gray-800 text-white py-6 md:py-4'>
            <div class='container mx-auto flex flex-col lg:flex-row items-center justify-between px-4 gap-y-4 lg:space-y-0'>
                <div class='text-center lg:text-left order-2 lg:order-1'>
                    <p class='text-sm text-gray-300'>
                        &copy; {new Date().getFullYear()}{' '}
                        <span class='font-semibold'>VailNote</span>. All rights reserved.
                    </p>
                </div>
                <div class='flex flex-col sm:flex-row items-center text-center gap-3 sm:gap-4 order-1 lg:order-2'>
                    {/* GitHub and Author Info Row */}
                    <div class='flex items-center gap-3'>
                        <a
                            href='https://github.com/emilkrebs/VailNote'
                            title='Source Code'
                            class='hover:scale-110 transition-transform'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            <img
                                src='/icons/github_logo.svg'
                                class='w-6 h-6 object-contain'
                                alt='GitHub'
                            />
                        </a>
                        <span class='hidden sm:inline text-gray-400'>|</span>
                        <span class='text-sm'>
                            Made with <span class='text-red-400'>❤️</span> by{' '}
                            <a
                                href='https://emilkrebs.dev/'
                                class='underline hover:text-blue-300 transition-colors'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Emil Krebs
                            </a>
                        </span>
                    </div>

                    {/* Links Row */}
                    <div class='flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm'>
                        {links.map((link, idx) => (
                            <>
                                {idx === 0 && <span class='hidden sm:inline text-gray-400'>|</span>}
                                <a
                                    href={link.href}
                                    class='underline hover:text-blue-300 transition-colors px-1'
                                    key={link.label}
                                    target={link.external ? '_blank' : '_self'}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                >
                                    {link.label}
                                </a>
                                {idx < links.length - 1 && <span class='text-gray-400'>|</span>}
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
