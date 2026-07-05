import { ComponentChildren } from 'preact';

interface PageShellProps {
    children: ComponentChildren;
    /** Content column width: 'narrow' for single-card flows, 'wide' for prose pages. */
    width?: 'narrow' | 'wide';
}

/**
 * Shared main-column wrapper for flow pages (view note, loading, errors, legal).
 * The site nav and footer come from _app.tsx; this only provides the aura + centered column.
 */
export default function PageShell({ children, width = 'narrow' }: PageShellProps) {
    return (
        <main class='relative min-h-[70dvh] overflow-hidden'>
            <div class='aura' aria-hidden='true'></div>
            <div
                class={`relative mx-auto w-full ${
                    width === 'narrow' ? 'max-w-2xl' : 'max-w-3xl'
                } px-4 py-10 sm:px-6 sm:py-16`}
            >
                {children}
            </div>
        </main>
    );
}
