import CopyButton from './CopyButton.tsx';

type CopyFieldProps = {
    label: string;
    value: string;
    title?: string;
};

export default function CopyField({ label, value, title }: CopyFieldProps) {
    return (
        <div class='flex flex-col gap-1.5 min-w-0'>
            <p class='text-sm font-medium text-muted'>{label}</p>
            <div class='flex items-center gap-2 min-w-0 bg-bg border border-line-strong rounded-control pl-3 pr-1.5 py-1.5'>
                <code
                    class='flex-1 min-w-0 font-mono text-sm text-ink break-all py-1'
                    title={title ?? value}
                >
                    {value}
                </code>
                <CopyButton value={value} label={`Copy ${label.toLowerCase()}`} />
            </div>
        </div>
    );
}
