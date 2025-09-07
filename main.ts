import { App, staticFiles, trailingSlashes } from 'fresh';
import { VailnoteContext } from './middleware.ts';

export const app = new App<VailnoteContext>();

app.use(async (ctx) => {
	if (!Deno.env.get('BUILD_MODE')) {
		ctx.state.options = {
			testMode: false,
			databaseUri: Deno.env.get('DATABASE_URI'),
		};
	}
	return await ctx.next();
});

app.use(staticFiles())
	.use(trailingSlashes('never'))
	.fsRoutes();
