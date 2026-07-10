import Header from '../components/Header.tsx';
import CreateNote from '../islands/CreateNoteForm.tsx';
import CipherText from '../islands/CipherText.tsx';
import { ORIGIN } from '../lib/types/common.ts';
import { ButtonLink } from '../components/Button.tsx';
import { ArrowUpRightIcon, FireIcon, GithubLogoIcon, LinkSimpleIcon, NotePencilIcon } from '../components/Icons.tsx';

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
                <FightChatControl />
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
                        Encrypted in your browser, unreadable to the server, gone after viewing. True zero-knowledge.
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
        code: 'WRITE',
        icon: NotePencilIcon,
        title: 'Write your note',
        body: 'Encrypted with AES-256-GCM in your browser before anything touches the network.',
    },
    {
        code: 'SHARE',
        icon: LinkSimpleIcon,
        title: 'Share the link',
        body: 'The decryption key rides in the link fragment, the part of a URL browsers never send to servers.',
    },
    {
        code: 'DESTROY',
        icon: FireIcon,
        title: 'Read once, then gone',
        body: 'Opening the note destroys it. Unopened notes expire on a schedule you set, 10 minutes to 90 days.',
    },
];

/**
 * The sequence is rendered as a machined rail rather than three equal icon-chip
 * cards: a running line with a filled detent at each stage (like tick marks on a
 * dial), mono stage codes standing in for the numbered-marker cliche, and the icon
 * demoted to a small inline glyph next to the title instead of a boxed chip.
 */
function HowItWorks() {
    return (
        <section id='how-it-works' class='border-t border-line scroll-mt-16'>
            <div class='mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24'>
                <div class='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
                    <h2 class='text-title'>How it works</h2>
                    <p class='font-mono text-xs text-faint' aria-hidden='true'>SEQUENCE / 3 STAGES</p>
                </div>

                <ol class='relative mt-14 flex flex-col gap-0 md:mt-20 md:flex-row md:items-stretch md:gap-0'>
                    {/* the running rail: vertical on mobile, horizontal across the row on md+ */}
                    <div
                        class='absolute top-0 bottom-0 left-3.75 w-px bg-line-strong md:top-3.75 md:right-0 md:bottom-auto md:left-0 md:h-px md:w-auto'
                        aria-hidden='true'
                    >
                    </div>

                    {steps.map((step, i) => (
                        <li
                            key={step.title}
                            class='relative flex gap-5 pb-12 pl-0 last:pb-0 md:flex-1 md:flex-col md:gap-0 md:pb-0 md:pr-8 md:last:pr-0'
                        >
                            {/* detent: a filled tick on the rail marking this stage */}
                            <div
                                class='relative z-10 flex size-7.75 shrink-0 items-center justify-center'
                                aria-hidden='true'
                            >
                                <span class='size-2 rounded-full bg-accent-bright ring-4 ring-bg'></span>
                            </div>

                            <div class='min-w-0 md:mt-8'>
                                <div class='flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-faint'>
                                    <span class='text-accent-bright'>{String(i + 1).padStart(2, '0')}</span>
                                    <span>{step.code}</span>
                                </div>
                                <h3 class='mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight'>
                                    <step.icon size={17} class='shrink-0 text-muted' />
                                    {step.title}
                                </h3>
                                <p class='mt-2 max-w-[32ch] text-[0.9375rem] leading-relaxed text-muted'>
                                    {step.body}
                                </p>
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
        title: 'Keys stay with you',
        body: 'Link keys live in the URL fragment. Password keys are derived in your browser with PBKDF2.',
    },
    {
        title: 'Ciphertext at rest',
        body: 'The database holds encrypted bytes and an expiry date. Passwords are stored only as bcrypt hashes.',
    },
    {
        title: 'Nothing to correlate',
        body:
            'No analytics and no ad scripts. Rate limiting uses anonymous credentials (ARC) instead of logging who you are.',
    },
];

/**
 * Signature moment of the page: a recessed instrument-panel band (darker than the
 * surrounding surface, inset border) housing the mechanism readout. This is the one
 * section that departs from the standard hairline-top rhythm on purpose.
 */
function Security() {
    return (
        <section id='security' class='scroll-mt-16 bg-bg py-16 sm:py-24'>
            <div class='mx-auto max-w-6xl px-4 sm:px-6'>
                <div class='panel-recessed rounded-panel px-5 py-10 sm:px-10 sm:py-14'>
                    <div class='grid items-center gap-12 lg:grid-cols-2 lg:gap-16'>
                        <div>
                            <p class='font-mono text-xs tracking-[0.14em] text-faint'>READOUT / SERVER SIDE</p>
                            <h2 class='mt-3 text-title'>What reaches our server</h2>
                            <p class='mt-4 max-w-[50ch] text-[1.0625rem] leading-relaxed text-muted'>
                                Encryption happens before upload, and the key never leaves the link fragment. All we can
                                store is ciphertext with an expiry date.
                            </p>
                            <ul class='mt-8 flex flex-col gap-6 border-t border-line pt-8'>
                                {securityFacts.map((fact, i) => (
                                    <li key={fact.title} class='flex gap-4'>
                                        <span
                                            class='mt-0.5 shrink-0 font-mono text-xs text-faint'
                                            aria-hidden='true'
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                            <h3 class='flex items-center gap-2 font-semibold tracking-tight'>
                                                {fact.title}
                                            </h3>
                                            <p class='mt-1 text-[0.9375rem] leading-relaxed text-muted'>
                                                {fact.body}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <CipherPanel />
                    </div>
                </div>
            </div>
        </section>
    );
}

function CipherPanel() {
    return (
        <figure class='relative'>
            <div class='rounded-panel border border-line-strong bg-surface p-5 font-mono text-sm sm:p-7'>
                <div class='flex items-center justify-between text-xs text-faint'>
                    <span class='tracking-[0.14em]'>YOU WRITE</span>
                </div>
                <p class='mt-3 text-ink'>door code is 4417, delete this after reading</p>

                <div class='my-6 flex items-center gap-3 text-xs text-faint' aria-hidden='true'>
                    <span class='h-px flex-1 bg-line-strong'></span>
                    AES-256-GCM
                    <span class='h-px flex-1 bg-line-strong'></span>
                </div>

                <div class='flex items-center justify-between text-xs text-faint'>
                    <span class='tracking-[0.14em]'>WE STORE</span>
                </div>
                <p class='mt-3 break-all leading-relaxed text-muted'>
                    o5T9dXcE2K/wYq7hZk0mQxV3sB1uNfLgjRa8pDwiCH6yUOJtM4vGnrPS+Abek9zFqW5hT2cLxYmD0uK8sNVi7EJgw==
                </p>
            </div>
            <figcaption class='mt-3 text-sm text-faint'>
                Illustrative ciphertext. The transformation happens entirely in your browser.
            </figcaption>
        </figure>
    );
}

/**
 * Closing statement band: privacy advocacy rendered as one oversized link. The EU's
 * Chat Control proposal would mandate client-side scanning of private messages,
 * undermining the end-to-end encryption VailNote is built on.
 */
function FightChatControl() {
    return (
        <section class='border-t border-line'>
            <div class='mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24'>
                <p class='font-mono text-xs tracking-[0.14em] text-faint'>PRIVACY IS NOT A GIFT</p>
                <h2 class='mt-4 text-display'>
                    <a
                        href='https://fightchatcontrol.eu/'
                        target='_blank'
                        rel='noopener noreferrer'
                        class='group inline-flex flex-wrap items-baseline gap-x-3 text-ink transition-colors duration-150 hover:text-accent-bright'
                    >
                        Fight Chat Control
                        <ArrowUpRightIcon
                            size='0.62em'
                            class='self-center text-faint transition-colors duration-150 group-hover:text-accent-bright'
                        />
                    </a>
                </h2>
                <p class='mt-5 max-w-[52ch] text-lg leading-relaxed text-muted'>
                    The EU's Chat Control law allows AI scanning of private messages. <a href='https://fightchatcontrol.eu/' target='_blank' rel='noopener noreferrer' class='hover:underline'>Learn how to act.</a>
                </p>
            </div>
        </section>
    );
}

function OpenSource() {
    return (
        <section id='open-source' class='border-t border-line scroll-mt-16'>
            <div class='mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_auto] lg:gap-16'>
                <div class='max-w-xl'>
                    <h2 class='text-title'>100% Open-Source</h2>
                    <p class='mt-4 text-[1.0625rem] leading-relaxed text-muted'>
                        Every line of code that touches your notes is public, MIT-licensed, and self-hostable. Audit it,
                        fork it, or run your own.
                    </p>
                    <div class='mt-8 flex flex-col gap-3 sm:flex-row'>
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

                {/* stamped plate: a small machined-metadata block, standing in for a generic badge row */}

                <dl class='grid grid-cols-3 gap-6 text-start text-sm sm:gap-8 border-l border-line pl-6 sm:pl-8 lg:pl-10'>
                    <div>
                        <dt class='text-xs tracking-[0.14em] text-faint'>LICENSE</dt>
                        <dd class='mt-1 text-ink'>MIT</dd>
                    </div>
                    <div>
                        <dt class='text-xs tracking-[0.14em] text-faint'>TRACKING</dt>
                        <dd class='mt-1 text-ink'>none</dd>
                    </div>
                    <div>
                        <dt class='text-xs tracking-[0.14em] text-faint'>SELF-HOST</dt>
                        <dd class='mt-1 text-ink'>yes</dd>
                    </div>
                </dl>
            </div>
        </section>
    );
}
