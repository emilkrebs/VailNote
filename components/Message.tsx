import { JSX } from 'preact';
import { CheckCircleIcon, InfoIcon, WarningIcon } from './Icons.tsx';

type MessageVariant = 'success' | 'error' | 'info' | 'warning';

type MessageProps = JSX.IntrinsicElements['div'] & {
    visible?: boolean;
    variant?: MessageVariant;
};

const variantClasses: Record<MessageVariant, string> = {
    success: 'bg-ok-soft border-ok/30',
    error: 'bg-danger-soft border-danger/30',
    info: 'bg-accent-soft border-accent/30',
    warning: 'bg-warn-soft border-warn/30',
};

const variantIcons: Record<MessageVariant, JSX.Element> = {
    success: <CheckCircleIcon size={20} class='text-ok' />,
    error: <WarningIcon size={20} class='text-danger' />,
    info: <InfoIcon size={20} class='text-accent-bright' />,
    warning: <WarningIcon size={20} class='text-warn' />,
};

export default function Message(
    { visible = true, variant = 'info', children, class: className, ...props }: MessageProps,
) {
    if (!visible) return null;

    return (
        <div
            {...props}
            class={`flex items-start gap-3 p-4 rounded-panel border ${variantClasses[variant]} ${className || ''}`}
        >
            <span class='shrink-0 mt-0.5' aria-hidden='true'>{variantIcons[variant]}</span>
            <div class='flex-1 min-w-0 text-[0.9375rem] leading-relaxed'>{children}</div>
        </div>
    );
}
