import { Handlers, PageProps } from '$fresh/server.ts';
import { extract } from '$std/front_matter/yaml.ts';
import { join } from '$std/path/join.ts';
import { Head } from '$fresh/runtime.ts';
import Navbar from '../../components/Navbar.tsx';
import Card, { CardContent, CardHeader } from '../../components/Card.tsx';

export interface Post {
	slug: string;
	content: string;
	snippet?: string;
	title: string;
	createdAt: Date;
	author?: string;
	tags?: string[];
}

export async function getPosts(): Promise<Post[]> {
	try {
		const files = Deno.readDir('./blog');
		const promises = [];
		for await (const file of files) {
			if (file.name.endsWith('.md')) {
				const slug = file.name.replace('.md', '');
				promises.push(getPost(slug));
			}
		}
		const posts = await Promise.all(promises);
		const validPosts = posts.filter((post) => post !== null) as Post[];
		validPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		return validPosts;
	} catch (error) {
		console.error('Error reading blog posts:', error);
		return [];
	}
}

export async function getPost(slug: string): Promise<Post | null> {
	try {
		const text = await Deno.readTextFile(join('./blog', `${slug}.md`));
		const { attrs, body } = extract(text);

		// Type-safe attribute extraction
		const title = attrs.title as string || 'Untitled';
		const created_at = attrs.created_at as string;
		const snippet = attrs.snippet as string | undefined;
		const author = attrs.author as string | undefined;
		const tags = attrs.tags as string[] | undefined;

		return {
			slug,
			title,
			createdAt: new Date(created_at),
			content: body,
			snippet,
			author,
			tags,
		};
	} catch (error) {
		console.error(`Error reading post ${slug}:`, error);
		return null;
	}
}

export const handler: Handlers<Post[]> = {
	async GET(_req, ctx) {
		const posts = await getPosts();
		return ctx.render(posts);
	},
};

function PostCard({ post }: { post: Post }) {
	const formattedDate = post.createdAt.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<Card>
			<CardHeader class='flex items-center justify-between mb-4'>
				<div class='flex items-center space-x-2'>
					<time class='text-sm text-gray-500 dark:text-gray-400'>
						{formattedDate}
					</time>
					{post.author && (
						<>
							<span class='text-gray-300 dark:text-gray-600'>•</span>
							<span class='text-sm text-gray-600 dark:text-gray-400'>
								{post.author}
							</span>
						</>
					)}
				</div>

				<h2 class='text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
					<a href={`/blog/${post.slug}`} class='block'>
						{post.title}
					</a>
				</h2>
			</CardHeader>

			<CardContent>
				{post.snippet && (
					<p class='text-gray-600 dark:text-gray-300 mb-4 leading-relaxed'>
						{post.snippet}
					</p>
				)}

				{post.tags && post.tags.length > 0 && (
					<div class='flex flex-wrap gap-2 mb-4'>
						{post.tags.map((tag) => (
							<span
								key={tag}
								class='px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full'
							>
								#{tag}
							</span>
						))}
					</div>
				)}

				<a
					href={`/blog/${post.slug}`}
					class='inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors'
				>
					Read more
					<svg class='ml-1 w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5l7 7-7 7' />
					</svg>
				</a>
			</CardContent>
		</Card>
	);
}

export default function BlogIndexPage(props: PageProps<Post[]>) {
	const posts = props.data;

	return (
		<>
			<Head>
				<title>Blog - VailNote</title>
				<meta
					name='description'
					content='VailNote blog - tutorials, security tips, and platform updates for secure note-taking.'
				/>
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>

			<div class='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800'>
				<Navbar />

				<main class='container mx-auto px-4 py-8'>
					<div class='max-w-4xl mx-auto'>
						{/* Header section */}
						<div class='text-center mb-12'>
							<div class='inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6'>
								<svg
									class='w-8 h-8 text-blue-600 dark:text-blue-400'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										stroke-linecap='round'
										stroke-linejoin='round'
										stroke-width='2'
										d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
									/>
								</svg>
							</div>
							<h1 class='text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4'>
								VailNote Blog
							</h1>
							<p class='text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
								Tutorials, security insights, and updates about secure note-taking and privacy-focused digital tools.
							</p>
						</div>

						{/* Posts grid */}
						{posts.length > 0
							? (
								<div class='grid gap-8 md:gap-6'>
									{posts.map((post) => <PostCard key={post.slug} post={post} />)}
								</div>
							)
							: (
								<div class='text-center py-12'>
									<div class='inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4'>
										<svg class='w-8 h-8 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
											<path
												stroke-linecap='round'
												stroke-linejoin='round'
												stroke-width='2'
												d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
											/>
										</svg>
									</div>
									<h3 class='text-lg font-medium text-gray-900 dark:text-white mb-2'>
										No blog posts yet
									</h3>
									<p class='text-gray-500 dark:text-gray-400'>
										Check back soon for tutorials and updates!
									</p>
								</div>
							)}
					</div>
				</main>
			</div>
		</>
	);
}
