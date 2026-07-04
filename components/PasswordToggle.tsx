import { useState } from 'preact/hooks';
import { JSX } from 'preact';
import { FormField } from './Form.tsx';
import { EyeIcon, EyeSlashIcon } from './Icons.tsx';

interface PasswordToggleProps extends JSX.InputHTMLAttributes {
    error?: string;
    helpText?: string;
}

export default function PasswordToggle(props: PasswordToggleProps) {
    const [isHidden, setIsHidden] = useState(true);

    return (
        <FormField error={props.error} helpText={props.helpText}>
            <div class='relative w-full'>
                <input
                    {...props}
                    class={`input pr-12 ${props.class || ''}`}
                    type={isHidden ? 'password' : 'text'}
                />
                <button
                    type='button'
                    class='absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-control text-muted hover:text-ink transition-colors cursor-pointer'
                    onClick={() => setIsHidden(!isHidden)}
                    aria-label={isHidden ? 'Show password' : 'Hide password'}
                    title={isHidden ? 'Show password' : 'Hide password'}
                >
                    {isHidden ? <EyeIcon size={20} /> : <EyeSlashIcon size={20} />}
                </button>
            </div>
        </FormField>
    );
}
