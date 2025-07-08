import { defineConfig } from '$fresh/server.ts';
import tailwind from '$fresh/plugins/tailwind.ts';
import { Context } from './routes/_middleware.ts';
import '$std/dotenv/load.ts';

export const TEST_MODE = Deno.env.get('TEST_MODE') === 'true';

if (!Deno.env.get('BUILD_MODE')) {
	await Context.init({
		testMode: TEST_MODE,
		databaseUri: Deno.env.get('BASE_URI') || '',
		testDatabaseUri: Deno.env.get('TEST_BASE_URI') || '',
	});
}

export default defineConfig({
	plugins: [tailwind()],
});
