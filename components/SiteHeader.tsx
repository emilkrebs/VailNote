import { GithubLogoIcon, LockKeyIcon } from './Icons.tsx';

const navLinks = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#security', label: 'Security' },
    { href: '/#open-source', label: 'Open source' },
];

export default function SiteHeader() {
    return (
        <header class='sticky top-0 z-40 h-16 border-b border-line bg-bg/85 backdrop-blur'>
            <nav class='mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6'>
                <a href='/' class='flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-ink'>
                    <span class='flex size-8 items-center justify-center rounded-control bg-accent-soft text-accent-bright'>
                        <LockKeyIcon size={18} />
                    </span>
                    VailNote
                </a>

                <div class='flex items-center gap-1 sm:gap-2'>
                    <div class='hidden md:flex items-center'>
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                class='px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink'
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <a
                        href='https://github.com/emilkrebs/VailNote'
                        target='_blank'
                        rel='noopener noreferrer'
                        class='flex items-center gap-2 rounded-control border border-line-strong px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/60 hover:text-ink'
                    >
                        <GithubLogoIcon size={17} />
                        <span class='hidden sm:inline'>GitHub</span>
                    </a>
                </div>
            </nav>
        </header>
    );
}
