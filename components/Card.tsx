import type { JSX } from 'preact';

type DivProps = JSX.IntrinsicElements['div'];
type HeadingProps = JSX.IntrinsicElements['h2'];

export default function Card({ children, ...props }: DivProps) {
    return (
        <div
            {...props}
            class={`bg-surface rounded-panel border border-line ${props.class || ''}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, ...props }: DivProps) {
    return (
        <div {...props} class={`flex flex-col gap-3 p-5 sm:p-8 ${props.class ?? ''}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, ...props }: HeadingProps) {
    return (
        <h2 {...props} class={`text-2xl font-bold tracking-tight ${props.class || ''}`}>
            {children}
        </h2>
    );
}

export function CardContent({ children, ...props }: DivProps) {
    return (
        <div {...props} class={`px-5 pb-5 sm:px-8 sm:pb-8 ${props.class || ''}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, ...props }: DivProps) {
    return (
        <div {...props} class={`p-5 sm:p-8 border-t border-line ${props.class || ''}`}>
            {children}
        </div>
    );
}
