import { defineConfig } from '$fresh/server.ts';
import tailwind from '$fresh/plugins/tailwind.ts';
import { Context } from './routes/_middleware.ts';
import '$std/dotenv/load.ts';

if (!Deno.env.get('BUILD_MODE')) {
	await Context.init();
}

export default defineConfig({
	plugins: [tailwind()],
});
