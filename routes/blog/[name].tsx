import { Handlers, PageProps } from '$fresh/server.ts';
import { CSS, render } from '@deno/gfm';
import { Head } from '$fresh/runtime.ts';
import SiteHeader from '../../components/SiteHeader.tsx';
import Footer from '../../components/Footer.tsx';
import { getPost, Post } from './index.tsx';
import Navbar from '../../components/Navbar.tsx';

export const handler: Handlers<Post> = {
	async GET(_req, ctx) {
		const post = await getPost(ctx.params.name);
		if (post === null) return ctx.renderNotFound();
		return ctx.render(post);
	},
};

export default function BlogPage({ data }: PageProps<Post | null>) {
	if (!data) {
		return (
			<>
				<Head>
					<title>Post Not Found - VailNote</title>
				</Head>
				<Navbar />
				<div class='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800'>
					<main class='container mx-auto px-4 py-8'>
						<div class='max-w-4xl mx-auto text-center'>
							<h1 class='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
								Post Not Found
							</h1>
							<p class='text-gray-600 dark:text-gray-300 mb-8'>
								The blog post you're looking for doesn't exist.
							</p>
							<a
								href='/blog'
								class='inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
							>
								← Back to Blog
							</a>
						</div>
					</main>
				</div>
			</>
		);
	}

	const formattedDate = data.createdAt.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<>
			<Head>
				<title>{data.title} - VailNote Blog</title>
				<meta name='description' content={data.snippet || `Read "${data.title}" on VailNote Blog`} />
				<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			</Head>
			<style>
				{CSS}
			</style>

			<div class='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800'>
				<SiteHeader />

				<main class='container mx-auto px-4 py-8'>
					<div class='max-w-4xl mx-auto'>
						{/* Back to blog link */}
						<div class='mb-8'>
							<a
								href='/blog'
								class='inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors'
							>
								<svg class='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 19l-7-7 7-7' />
								</svg>
								Back to Blog
							</a>
						</div>

						{/* Article header */}
						<header class='mb-8'>
							<h1 class='text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4'>
								{data.title}
							</h1>

							<div class='flex items-center space-x-4 text-gray-600 dark:text-gray-300 mb-6'>
								<time>{formattedDate}</time>
								{data.author && (
									<>
										<span>•</span>
										<span>By {data.author}</span>
									</>
								)}
							</div>

							{data.tags && data.tags.length > 0 && (
								<div class='flex flex-wrap gap-2'>
									{data.tags.map((tag) => (
										<span
											key={tag}
											class='px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full'
										>
											#{tag}
										</span>
									))}
								</div>
							)}
						</header>

						{/* Article content */}
						<article class='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
							<div class='p-8'>
								<div
									// deno-lint-ignore react-no-danger
									dangerouslySetInnerHTML={{ __html: render(data.content) }}
								/>
							</div>
						</article>

						{/* Footer navigation */}
						<div class='mt-12 pt-8 border-t border-gray-200 dark:border-gray-700'>
							<div class='flex justify-between items-center'>
								<a
									href='/blog'
									class='inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
								>
									<svg class='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 19l-7-7 7-7' />
									</svg>
									More Posts
								</a>

								<a
									href='/'
									class='inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors'
								>
									Home
									<svg class='w-4 h-4 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
										<path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5l7 7-7 7' />
									</svg>
								</a>
							</div>
						</div>
					</div>
				</main>

				<Footer />
			</div>
		</>
	);
}
