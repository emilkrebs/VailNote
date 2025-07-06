import { Handlers, PageProps } from '$fresh/server.ts';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import { CSS, render } from '@deno/gfm';

interface Page {
	markdown: string;
}

// Read PRIVACY.md file and render it as HTML
export const handler: Handlers<Page> = {
	async GET(_req, ctx) {
		try {
			const rawMarkdown = await Deno.readTextFile('./PRIVACY.md');
			if (!rawMarkdown) {
				return ctx.render(undefined);
			}
			return ctx.render({ markdown: rawMarkdown });
		} catch (_error) {
			return ctx.render(undefined);
		}
	},
};

export default function Privacy({ data }: PageProps<Page | null>) {
	if (!data) {
		return <h1>File not found.</h1>;
	}
	return (
		<>
			<Header title='Privacy Policy' />
			<style>
				{CSS}
			</style>
			<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
				<h1 class='text-4xl font-bold mb-2'>Privacy Policy</h1>
				<p class='mt-2 text-lg text-gray-200'>
					Your privacy and security are our top priorities.
				</p>
				<div class='flex items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8 gap-8'>
					<div class='flex flex-col gap-4 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
						<div
							class='markdown-body'
							// deno-lint-ignore react-no-danger
							dangerouslySetInnerHTML={{ __html: render(data?.markdown) }}
						/>

						<HomeButton />
					</div>
				</div>
			</div>
		</>
	);
}
