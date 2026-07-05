import { ArrowUpRightIcon, GithubLogoIcon } from './Icons.tsx';

const links = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: 'https://emilkrebs.dev/imprint', label: 'Imprint', external: true },
    { href: 'https://github.com/emilkrebs/VailNote/wiki', label: 'Wiki', external: true },
];

export default function Footer() {
    return (
        <footer class='border-t border-line'>
            <div class='mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between'>
                <div class='flex flex-col gap-2'>
                    <p class='text-base font-extrabold tracking-tight text-ink'>VailNote</p>
                    <p class='max-w-xs text-sm leading-relaxed text-muted'>
                        Zero-knowledge encrypted notes that self-destruct after reading.
                    </p>
                    <p class='mt-2 text-sm text-faint'>
                        &copy; {new Date().getFullYear()} VailNote, MIT licensed. Made by{' '}
                        <a
                            href='https://emilkrebs.dev/'
                            target='_blank'
                            rel='noopener noreferrer'
                            class='text-muted underline underline-offset-2 transition-colors hover:text-ink'
                        >
                            Emil Krebs
                        </a>.
                    </p>
                </div>

                <nav class='flex flex-col gap-3' aria-label='Footer'>
                    <div class='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm'>
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                target={link.external ? '_blank' : undefined}
                                rel={link.external ? 'noopener noreferrer' : undefined}
                                class='inline-flex items-center gap-1 text-muted transition-colors hover:text-ink'
                            >
                                {link.label}
                                {link.external && <ArrowUpRightIcon size={13} class='text-faint' />}
                            </a>
                        ))}
                    </div>
                    <a
                        href='https://github.com/emilkrebs/VailNote'
                        target='_blank'
                        rel='noopener noreferrer'
                        class='inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink'
                    >
                        <GithubLogoIcon size={16} />
                        Source code on GitHub
                    </a>
                </nav>
            </div>
        </footer>
    );
}
