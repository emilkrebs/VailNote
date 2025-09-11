import { defineConfig } from 'vite';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	envDir: '.',
	plugins: [
		fresh(),
		tailwindcss(),
	],
	build: {
		rollupOptions: {
			external: (id: string) => {
				// Externalize file:// URLs that Rollup can't resolve
				if (id.startsWith('file:///')) {
					return true;
				}
				return false;
			},
		},
	},
});
