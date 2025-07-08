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
import { initializeArcRateLimiter } from './utils/rate-limiting/rate-limiter.ts';
import { defaultLogger } from './utils/logging.ts';

const BUILD_MODE = Deno.env.get('BUILD_MODE') === 'true';

if (BUILD_MODE) {
	defaultLogger.log('Running in build mode, skipping database initialization and rate limiter setup.');
}

// Only initialize database if not in build mode
if (!BUILD_MODE) {
	await initializeDatabase();
	initializeArcRateLimiter();
}

// Graceful shutdown handling
const handleShutdown = async () => {
	defaultLogger.log('Received shutdown signal, closing database connection...');
	await closeDatabase();
	Deno.exit(0);
};

if (!BUILD_MODE) {
	Deno.addSignalListener('SIGINT', handleShutdown);
	try {
		Deno.addSignalListener('SIGTERM', handleShutdown);
	} catch {
		defaultLogger.warn('SIGTERM signal not available, ignoring.');
	}
}

await start(manifest, config);
