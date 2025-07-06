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

// Only initialize database if not in build mode
if (!Deno.env.get('BUILD_MODE')) {
	await initializeDatabase();
}

// Graceful shutdown handling
const handleShutdown = async () => {
	console.log('Received shutdown signal, closing database connection...');
	await closeDatabase();
	Deno.exit(0);
};

if (!Deno.env.get('BUILD_MODE')) {
	Deno.addSignalListener('SIGINT', handleShutdown);
	try {
		Deno.addSignalListener('SIGTERM', handleShutdown);
	} catch {
		console.warn('SIGTERM signal not available, ignoring.');
	}
}

await start(manifest, config);
