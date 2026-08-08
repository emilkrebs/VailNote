#!/usr/bin/env node
// VailNote CLI - npm launcher.
// Bridges the tiny set of Deno APIs used by the CLI onto Node, then runs the
// bundled build (vailnote-core.mjs) produced by `deno task build:npm`.
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';

globalThis.crypto ??= webcrypto;

globalThis.Deno = {
  args: process.argv.slice(2),
  env: {
    get: (key) => process.env[key] ?? undefined,
    has: (key) => key in process.env,
    toObject: () => ({ ...process.env }),
  },
  exit: (code) => process.exit(code),
  readTextFile: (path) => readFile(path, 'utf8'),
  stdin: { readable: process.stdin },
};

const { runCli } = await import('./vailnote-core.mjs');
await runCli(process.argv.slice(2));
