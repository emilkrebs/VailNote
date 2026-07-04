# Product

## Register

brand

(The landing page is the primary surface and the product itself lives on it: the create-note form is the hero. Inner
flows `/[id]`, errors, and legal pages follow product-register discipline inside the same visual system.)

## Users

Privacy-conscious people who need to hand someone a secret right now: a password, an API key, a personal message.
Developers, sysadmins, and ordinary users sent here by one. They arrive with something sensitive in their clipboard,
want zero friction (no account, no tracking), and need to trust the tool within seconds of landing.

## Product Purpose

VailNote is an open-source, zero-knowledge note-sharing service. Notes are encrypted in the browser before upload,
self-destruct after viewing or expiry, and the server can never read them. Success = a visitor pastes a secret, sets an
expiry, and shares a link in under 30 seconds, and feels safe doing it.

## Brand Personality

Guarded, precise, quietly confident. The interface should feel like a well-machined vault door: heavy, exact, calm.
Technical credibility over marketing flash; the security claims are real and verifiable (open source), so the design
states them plainly instead of shouting.

## Anti-references

- Generic AI-gradient SaaS landings: purple glows, three equal feature cards, emoji icons, "Why choose us?" sections.
- Crypto/web3 aesthetics: neon, glitch, hype copy.
- Enterprise-security bloat: stock photos of padlocks and hoodie-hackers, badge walls, fear-based copy.

## Design Principles

1. **The product is the hero.** The real create-note form sits in the first viewport; no fake screenshots, no detours.
2. **Show the mechanism, earn the trust.** Explain client-side encryption concretely (what leaves the browser, what
   doesn't) instead of asserting "military-grade security".
3. **Calm under pressure.** Users may be mid-incident sharing credentials. High contrast, plain language, no motion that
   competes with the task.
4. **One accent, locked.** Brand blue is the only interactive accent; green/red/amber appear only as semantic state.
5. **Nothing to hide.** Open source, no tracking, readable legal pages; the design mirrors that transparency.

## Accessibility & Inclusion

WCAG AA minimum contrast everywhere (body 4.5:1, large text 3:1), visible focus rings on every interactive element,
labels above inputs (never placeholder-as-label), full keyboard operability, `prefers-reduced-motion` honored for all
animation, and the whole flow usable at 320 px width.
