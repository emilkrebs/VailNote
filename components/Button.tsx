import { JSX } from 'preact';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends JSX.ButtonHTMLAttributes {
    variant?: ButtonVariant;
}

const baseClasses = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-control font-semibold ' +
    'transition-colors duration-150 active:translate-y-px cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-accent-deep text-white hover:bg-accent-deeper',
    secondary: 'bg-raised text-ink border border-line-strong hover:border-accent/60 hover:text-white',
    danger: 'bg-danger-deep text-white hover:bg-danger-deeper',
};

export function Button({ variant = 'primary', ...props }: ButtonProps) {
    return (
        <button
            {...props}
            class={`${baseClasses} ${variantClasses[variant]} ${props.class ?? ''}`}
        >
            {props.children}
        </button>
    );
}

interface ButtonLinkProps extends JSX.AnchorHTMLAttributes {
    variant?: ButtonVariant;
}

/** Anchor styled identically to Button, for link actions that should read as buttons. */
export function ButtonLink({ variant = 'primary', ...props }: ButtonLinkProps) {
    return (
        <a
            {...props}
            class={`${baseClasses} ${variantClasses[variant]} ${props.class ?? ''}`}
        >
            {props.children}
        </a>
    );
}
