import { App, staticFiles } from 'fresh';

export interface State {
	shared: string;
}

export const app = new App<State>();

app.use(staticFiles())
	.fsRoutes();
