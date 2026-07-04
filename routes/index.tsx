import Header from '../components/Header.tsx';
import CreateNote from '../islands/CreateNoteForm.tsx';
import CipherText from '../islands/CipherText.tsx';
import { ORIGIN } from '../lib/types/common.ts';
import { ButtonLink } from '../components/Button.tsx';
import {
    CloudSlashIcon,
    DetectiveIcon,
    FireIcon,
    GithubLogoIcon,
    KeyIcon,
    LinkSimpleIcon,
    NotePencilIcon,
} from '../components/Icons.tsx';

export default function Home() {
    return (
        <>
            <Header
                title='Secure Encrypted Note Sharing'
                description='Share encrypted notes securely with VailNote. Open-source note sharing with end-to-end encryption, automatic deletion, and privacy-preserving features. No tracking, maximum security.'
                canonicalUrl={ORIGIN}
            />
            <main>
                <Hero />
                <HowItWorks />
                <Security />
                <OpenSource />
            </main>
        </>
    );
}

function Hero() {
    return (
        <section class='relative overflow-hidden'>
            <div class='aura' aria-hidden='true'></div>
            <div class='relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:grid-cols-12 lg:gap-14'>
                <div class='reveal max-w-xl lg:col-span-5 lg:max-w-none lg:self-center lg:pb-16'>
                    <p class='font-mono text-sm text-accent-bright'>
                        <CipherText text='the server only sees ciphertext' />
                    </p>
                    <h1 class='mt-4 text-display'>
                        Share secrets that vanish.
                    </h1>
                    <p class='mt-5 max-w-[46ch] text-lg leading-relaxed text-muted'>
                        Encrypted in your browser, unreadable to us, gone after one view. No account. No tracking.
                    </p>
                </div>

                <div class='reveal reveal-2 lg:col-span-7'>
                    <CreateNote />
                </div>
            </div>
        </section>
    );
}

const steps = [
    {
        icon: NotePencilIcon,
        title: 'Write your note',
        body: 'It is encrypted with AES-256-GCM in your browser before anything touches the network.',
    },
    {
        icon: LinkSimpleIcon,
        title: 'Share the link',
        body: 'The decryption key rides in the link fragment, the part of a URL that browsers never send to servers.',
    },
    {
        icon: FireIcon,
        title: 'Read once, then gone',
        body:
            'Opening the note destroys it. Unopened notes expire on the schedule you set, from 10 minutes to 30 days.',
    },
];

function HowItWorks() {
    return (
        <section id='how-it-works' class='border-t border-line scroll-mt-16'>
            <div class='mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24'>
                <h2 class='text-title'>How it works</h2>
                <ol class='mt-10 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12'>
                    {steps.map((step, i) => (
                        <li key={step.title} class='flex flex-col gap-4'>
                            <div class='flex items-center gap-3'>
                                <span class='flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-bright'>
                                    <step.icon size={20} />
                                </span>
                                <span class='font-mono text-sm text-faint' aria-hidden='true'>0{i + 1}</span>
                            </div>
                            <div>
                                <h3 class='text-lg font-semibold tracking-tight'>{step.title}</h3>
                                <p class='mt-2 text-[0.9375rem] leading-relaxed text-muted'>{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

const securityFacts = [
    {
        icon: KeyIcon,
        title: 'Keys stay with you',
        body: 'Link keys live in the URL fragment. Password keys are derived in your browser with PBKDF2.',
    },
    {
        icon: CloudSlashIcon,
        title: 'Ciphertext at rest',
        body: 'The database holds encrypted bytes and an expiry date. Passwords are stored only as bcrypt hashes.',
    },
    {
        icon: DetectiveIcon,
        title: 'Nothing to correlate',
        body:
            'No analytics and no ad scripts. Rate limiting uses anonymous credentials (ARC) instead of logging who you are.',
    },
];

function Security() {
    return (
        <section id='security' class='border-t border-line scroll-mt-16'>
            <div class='mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16'>
                <div>
                    <h2 class='text-title'>What reaches our server</h2>
                    <p class='mt-4 max-w-[50ch] text-[1.0625rem] leading-relaxed text-muted'>
                        Encryption happens before upload, and the key never leaves the link fragment. All we can store
                        is ciphertext with an expiry date.
                    </p>
                    <ul class='mt-8 flex flex-col gap-6'>
                        {securityFacts.map((fact) => (
                            <li key={fact.title} class='flex gap-4'>
                                <span class='mt-0.5 shrink-0 text-accent-bright'>
                                    <fact.icon size={22} />
                                </span>
                                <div>
                                    <h3 class='font-semibold tracking-tight'>{fact.title}</h3>
                                    <p class='mt-1 text-[0.9375rem] leading-relaxed text-muted'>{fact.body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <CipherPanel />
            </div>
        </section>
    );
}

function CipherPanel() {
    return (
        <figure>
            <div class='rounded-panel border border-line bg-surface p-5 font-mono text-sm sm:p-7'>
                <p class='text-xs text-faint'>you write</p>
                <p class='mt-2 text-ink'>door code is 4417, delete this after reading</p>

                <div class='my-6 flex items-center gap-3 text-xs text-faint' aria-hidden='true'>
                    <span class='h-px flex-1 bg-line-strong'></span>
                    AES-256-GCM
                    <span class='h-px flex-1 bg-line-strong'></span>
                </div>

                <p class='text-xs text-faint'>we store</p>
                <p class='mt-2 break-all leading-relaxed text-muted'>
                    o5T9dXcE2K/wYq7hZk0mQxV3sB1uNfLgjRa8pDwiCH6yUOJtM4vGnrPS+Abek9zFqW5hT2cLxYmD0uK8sNVi7EJgw==
                </p>
            </div>
            <figcaption class='mt-3 text-sm text-faint'>
                Illustrative ciphertext. The transformation happens entirely in your browser.
            </figcaption>
        </figure>
    );
}

function OpenSource() {
    return (
        <section id='open-source' class='border-t border-line scroll-mt-16'>
            <div class='mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24'>
                <h2 class='text-title'>Nothing to hide</h2>
                <p class='mt-4 text-[1.0625rem] leading-relaxed text-muted'>
                    Every line of code that touches your notes is public, MIT-licensed, and self-hostable. Audit it,
                    fork it, or run your own.
                </p>
                <div class='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
                    <ButtonLink
                        href='https://github.com/emilkrebs/VailNote'
                        target='_blank'
                        rel='noopener noreferrer'
                        variant='primary'
                    >
                        <GithubLogoIcon size={18} />
                        View source on GitHub
                    </ButtonLink>
                    <ButtonLink href='/privacy' variant='secondary'>
                        Read the privacy policy
                    </ButtonLink>
                </div>
            </div>
        </section>
    );
}
