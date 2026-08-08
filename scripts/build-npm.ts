/**
 * Bundles the CLI into a single Node-compatible ESM file for the npm package.
 * The CLI is dependency-free (no external imports), so the bundle contains
 * only the CLI and its lib modules. Run with: deno task build:npm
 */
import { build } from 'npm:esbuild@^0.25.0';

await build({
    entryPoints: ['cli/main.ts'],
    outfile: 'npm/bin/vailnote-core.mjs',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    sourcemap: 'inline',
    logLevel: 'info',
});

console.log('Built npm/bin/vailnote-core.mjs');
