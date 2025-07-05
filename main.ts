/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import '$std/dotenv/load.ts';

import { start } from '$fresh/server.ts';
import manifest from './fresh.gen.ts';
import config from './fresh.config.ts';
import { closeDatabase, initializeDatabase } from './database/db.ts';

await initializeDatabase();

// Graceful shutdown handling
const handleShutdown = async () => {
	console.log('Received shutdown signal, closing database connection...');
	await closeDatabase();
	Deno.exit(0);
};

// Listen for shutdown signals
Deno.addSignalListener('SIGINT', handleShutdown);
Deno.addSignalListener('SIGTERM', handleShutdown);

await start(manifest, config);
