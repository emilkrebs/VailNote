import { render } from '@deno/gfm';

export default function Markdown({ content }: { content: string }) {
	return (
		<div
			class='markdown-body'
			// deno-lint-ignore react-no-danger
			dangerouslySetInnerHTML={{ __html: render(content) }}
		/>
	);
}
