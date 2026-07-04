import type { JSX } from 'preact';
import { CaretRightIcon, WarningCircleIcon } from './Icons.tsx';

interface FormErrorProps {
    error?: string;
}

export function FormError({ error }: FormErrorProps) {
    if (!error) return null;

    return (
        <p class='flex items-center gap-1.5 text-sm font-medium text-danger'>
            <WarningCircleIcon size={16} class='shrink-0' />
            {error}
        </p>
    );
}

type DivProps = JSX.IntrinsicElements['div'];

export function FormGroup({ children, ...props }: DivProps) {
    return (
        <div {...props} class={`flex flex-col gap-2 ${props.class || ''}`}>
            {children}
        </div>
    );
}

interface FormFieldProps extends DivProps {
    error?: string;
    helpText?: string;
}

export function FormField({ children, error, helpText, ...props }: FormFieldProps) {
    return (
        <div {...props} class={`flex flex-col gap-1.5 ${props.class || ''}`}>
            {children}
            {helpText && <p class='text-sm text-faint'>{helpText}</p>}
            <FormError error={error} />
        </div>
    );
}

type LabelProps = JSX.IntrinsicElements['label'] & {
    required?: boolean;
};

export function Label({ required, ...props }: LabelProps) {
    return (
        <label {...props} class={`text-[0.9375rem] font-medium text-ink ${props.class || ''}`}>
            {props.children}
            {required && <span class='text-danger ml-1' title='Required'>*</span>}
        </label>
    );
}

export type InputProps = JSX.IntrinsicElements['input'] & {
    error?: string;
    helpText?: string;
};

export function Input(props: InputProps) {
    return (
        <FormField error={props.error} helpText={props.helpText}>
            <input
                {...props}
                class={`input ${props.class || ''}`}
            />
        </FormField>
    );
}

type TextareaProps = JSX.IntrinsicElements['textarea'] & {
    error?: string;
    helpText?: string;
};

export function Textarea(props: TextareaProps) {
    return (
        <FormField error={props.error} helpText={props.helpText}>
            <textarea
                {...props}
                class={`input ${props.class || ''}`}
            >
            </textarea>
        </FormField>
    );
}

type SelectProps = JSX.IntrinsicElements['select'] & {
    error?: string;
    helpText?: string;
};

export function Select(props: SelectProps) {
    return (
        <FormField error={props.error} helpText={props.helpText}>
            <select
                {...props}
                class={`input cursor-pointer ${props.class || ''}`}
            >
                {props.children}
            </select>
        </FormField>
    );
}

export function SelectOption(props: JSX.IntrinsicElements['option']) {
    return (
        <option
            {...props}
            class={`bg-raised text-ink ${props.class || ''}`}
        >
            {props.children}
        </option>
    );
}

type CollapsibleProps = JSX.IntrinsicElements['details'] & {
    title: string;
    isOpen?: boolean;
};

export function Collapsible({ title, isOpen = false, children, ...props }: CollapsibleProps) {
    return (
        <details
            {...props}
            open={isOpen}
            class={`group border-t border-line pt-4 ${props.class || ''}`}
        >
            <summary class='flex items-center gap-2 text-[0.9375rem] font-medium text-muted cursor-pointer select-none transition-colors hover:text-ink'>
                <CaretRightIcon size={14} class='transition-transform duration-200 group-open:rotate-90' />
                {title}
            </summary>
            <div class='mt-4 flex flex-col gap-2'>
                {children}
            </div>
        </details>
    );
}
