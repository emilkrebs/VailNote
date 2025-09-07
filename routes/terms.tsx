import { Handlers, PageProps } from '$fresh/server.ts';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import { CSS, render } from '@deno/gfm';
import Markdown from '../components/Markdown.tsx';
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '../components/Card.tsx';

interface Page {
	markdown: string;
}

// Read TERMS.md file and render it as HTML
export const handler: Handlers<Page> = {
	async GET(_req, ctx) {
		const rawMarkdown = await Deno.readTextFile('./TERMS.md');
		if (!rawMarkdown) {
			return ctx.render(undefined);
		}
		return ctx.render({ markdown: rawMarkdown });
	},
};

export default function Terms({ data }: PageProps<Page | null>) {
	if (!data) {
		return <h1>File not found.</h1>;
	}
	return (
		<>
			<Header title='Terms of Service' />
			<style>
				{CSS}
			</style>
			<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
				<h1 class='text-4xl text-center font-bold mb-2'>Terms of Service</h1>
				<p class='mt-2 text-base sm:text-lg text-center text-gray-200'>
					Legal terms and conditions for using VailNote.
				</p>
				<div class='flex items-center justify-center w-full max-w-screen-md mx-auto px-2 sm:px-4 py-8 gap-8'>
					<Card>
						<CardContent>
							<Markdown content={data.markdown} />
						</CardContent>

						<CardFooter>
							<HomeButton />
						</CardFooter>
					</Card>
				</div>
			</div>
		</>
	);
}
