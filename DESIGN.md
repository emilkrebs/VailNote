# DESIGN.md

Visual system for VailNote. Tokens live in `assets/styles.css` (Tailwind v4 `@theme`); this file is the human-readable
contract.

## Theme

Dark, locked. VailNote is a vault: someone shares a credential at a desk at night or mid-incident; the surface stays
dim, the content glows. There is no light mode by design (brand identity, not an omission). No section may invert to a
light background.

## Color

Strategy: **Restrained** base + one **Committed** accent. All colors OKLCH.

| Token                 | Value                    | Role                                                                |
| --------------------- | ------------------------ | ------------------------------------------------------------------- |
| `--color-bg`          | `oklch(15.5% 0.018 262)` | Page background (blue-tinted near-black)                            |
| `--color-surface`     | `oklch(20% 0.02 262)`    | Cards, panels, form container                                       |
| `--color-raised`      | `oklch(24% 0.022 262)`   | Inputs, nested surfaces, hover fills                                |
| `--color-ink`         | `oklch(96% 0.005 262)`   | Primary text                                                        |
| `--color-muted`       | `oklch(76% 0.015 262)`   | Secondary text (AA on bg and surface)                               |
| `--color-line`        | `oklch(100% 0 0 / 10%)`  | Hairline borders (`--color-line-strong` 18%)                        |
| `--color-accent`      | `oklch(62% 0.19 262)`    | THE brand blue (from logo `#1e50d9`); links, focus, primary actions |
| `--color-accent-deep` | `oklch(51% 0.21 262)`    | Primary button fill (white label ≥ 4.5:1)                           |
| `--color-ok`          | `oklch(78% 0.14 165)`    | Semantic success only (copy confirmed, note created)                |
| `--color-danger`      | `oklch(72% 0.17 22)`     | Semantic destructive only (destroy, errors)                         |
| `--color-warn`        | `oklch(83% 0.13 85)`     | Semantic caution only                                               |

Signature: the **veil aura**, a fixed low-opacity radial wash from accent blue to emerald (`--gradient-aura`). It is the
only place green may appear outside semantic state; it descends directly from the old animated blue→emerald body
gradient and is the brand's recognizable trace. Used once per page, behind the hero/header. Never on buttons, never as
text gradient.

Accent lock: interactive = blue, always. Green/red/amber carry state, never decoration.

## Typography

- **Geist** (self-hosted woff2, 400/500/600/800): all UI and display. One family, committed weight contrast.
- **Geist Mono** (400/500): ciphertext motif, share links, note IDs, technical values (`AES-256-GCM`). Mono is
  register-honest here (a real encryption tool), not costume; it never sets body copy.
- Display: `clamp(2.25rem, 1.4rem + 4vw, 3.75rem)`, weight 800, tracking `-0.03em`, `text-wrap: balance`.
- Body: 1rem/1.6, max 65ch. Muted text uses `--color-muted`, never lighter.
- Labels: 0.9375rem weight 500, above inputs. No placeholder-as-label.

## Shape

Documented radius rule (one system, everywhere):

- Controls (buttons, inputs, selects, textareas): **12px** (`--radius-control`)
- Containers (cards, messages, panels): **18px** (`--radius-panel`)
- Badges/pills: **full**

No other radii. Shadows are rare and tinted toward the page hue; hierarchy comes from surface steps + hairlines.

## Layout

- Container `max-w-6xl` (72rem), gutters `px-4 sm:px-6`.
- Nav: sticky 64px, single line at all widths, wordmark left / links right.
- Hero: asymmetric split at `lg` (message 5/12, live form 7/12), stacked single column below. `min-h` never uses
  `h-screen`; use `dvh` only where full-height is required.
- Sections breathe: `py-16 sm:py-24`. Grids collapse to one column below `md`. Every layout must hold at 320px.

## Motion

Intensity 4 (fluid CSS, no scroll-hijack). Everything gated behind `prefers-reduced-motion`.

- One hero entrance (fade + 12px rise, staggered ≤ 3 elements) per page load.
- The cipher decode animation (`islands/CipherText.tsx`): scrambled glyphs resolve into plaintext once. Motivation:
  storytelling; it demonstrates decryption. Used in one place per page, max.
- Interactive: 150-200ms ease-out transitions on color/border; `:active` presses `translate-y` 1px. No infinite loops
  except the slow aura drift (disabled under reduced motion).

## Iconography

Phosphor (vendored SVG paths in `components/Icons.tsx`, regular weight, MIT). One family, `1em` sizing, `currentColor`.
No emoji in UI, no hand-drawn paths.

## Components

- **Button**: solid `accent-deep` primary (white label), quiet `raised`+hairline secondary, `danger` solid for
  destructive. No gradients. Focus: 2px accent ring offset from a `--color-bg` gap.
- **Card/Panel**: `surface` + hairline, 18px radius, no backdrop blur by default.
- **Message**: semantic tinted background (10-14% alpha), solid semantic border-left is banned; full 1px border tinted
  same hue, icon + text at AA contrast.
- **Inputs**: `raised` fill, hairline border, accent focus ring; error text below field in `danger` at AA.

## Voice in copy

Plain, concrete, no fear. "Encrypted in your browser before it leaves your device", not "military-grade security". Never
invent metrics or testimonials.
