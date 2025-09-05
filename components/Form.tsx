import { JSX } from 'preact/jsx-runtime';

export function FormGroup({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) {
	return (
		<div class={`flex flex-col space-y-2 ${props.class || ''}`} {...props}>
			{children}
		</div>
	);
}

interface FormErrorProps {
	error?: string;
}

export function FormError({ error }: FormErrorProps) {
	if (!error) return null;

	return (
		<div class='text-sm font-medium text-red-600 bg-red-100 border border-red-600 px-4 py-3 rounded-lg'>
			{error}
		</div>
	);
}

interface FormFieldProps extends JSX.HTMLAttributes<HTMLDivElement> {
	error?: string;
	helpText?: string;
}

export function FormField({ children, error, helpText, ...props }: FormFieldProps) {
	return (
		<div class={`space-y-1 ${props.class || ''}`} {...props}>
			{helpText && <p class='text-gray-400 text-sm -mt-1'>{helpText}</p>}
			{children}
			{error && <FormError error={error} />}
		</div>
	);
}

interface LabelProps extends JSX.LabelHTMLAttributes {
	required?: boolean;
}

export function Label({ required, ...props }: LabelProps) {
	return (
		<label class={`text-white text-lg font-semibold ${props.class || ''}`} {...props}>
			{props.children}
			{required && <span class={`text-red-400 ml-1`}>*</span>}
		</label>
	);
}

export interface InputProps extends JSX.InputHTMLAttributes {
	error?: string;
	helpText?: string;
}

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

export interface TextareaProps extends JSX.TextareaHTMLAttributes {
	error?: string;
	helpText?: string;
}

export function Textarea(props: TextareaProps) {
	return (
		<FormField error={props.error} helpText={props.helpText}>
			<textarea
				{...props}
				class={`input ${props.class || ''}`}
			/>
		</FormField>
	);
}

interface SelectProps extends JSX.SelectHTMLAttributes {
	error?: string;
	helpText?: string;
}
export function Select(props: SelectProps) {
	return (
		<FormField error={props.error} helpText={props.helpText}>
			<select
				{...props}
				class={`input ${props.class || ''}`}
			>
				{props.children}
			</select>
		</FormField>
	);
}

export function SelectOption(props: JSX.OptionHTMLAttributes) {
	return (
		<option
			{...props}
			class={`bg-gray-900 text-white ${props.class || ''}`}
		>
			{props.children}
		</option>
	);
}

interface CollapsibleProps extends JSX.DetailsHTMLAttributes {
	title: string;
	isOpen?: boolean;
}

export function Collapsible({ title, isOpen = false, children, ...props }: CollapsibleProps) {
	return (
		<details
			open={isOpen}
			class={`group bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200 ${
				props.class || ''
			}`}
			{...props}
		>
			<summary class='text-white text-lg font-semibold cursor-pointer flex items-center gap-2 hover:text-blue-300 transition-colors'>
				<span class='transform group-open:rotate-90 transition-transform duration-200'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						class='h-5 w-5'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
					</svg>
				</span>
				{title}
			</summary>
			<div class='mt-6 pt-4 border-t border-gray-600/30'>
				{children}
			</div>
		</details>
	);
}
