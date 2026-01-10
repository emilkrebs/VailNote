import CopyButton from './CopyButton.tsx';

type CopyFieldProps = {
    label: string;
    value: string;
    title?: string;
};

export default function CopyField({ label, value, title }: CopyFieldProps) {
    return (
        <div class='bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 overflow-hidden min-h-12'>
            <div class='flex items-start gap-3 min-w-0'>
                <div class='flex-1 min-w-0'>
                    <p class='text-xs font-medium text-green-300 mb-1'>{label}</p>
                    <div class='flex items-center gap-2 min-w-0'>
                        <code
                            class='flex-1 min-w-0 text-sm font-mono text-slate-200 bg-slate-900/50 px-2 py-1 rounded border border-slate-600/30 break-all overflow-hidden'
                            title={title ?? value}
                        >
                            {value}
                        </code>
                        <CopyButton value={value} />
                    </div>
                </div>
            </div>
        </div>
    );
}
