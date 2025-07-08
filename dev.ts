#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from '$fresh/dev.ts';
import config from './fresh.config.ts';

import '$std/dotenv/load.ts';
import { initializeDatabase } from './database/db.ts';
import { initializeArcRateLimiter } from './utils/rate-limiting/rate-limiter.ts';

await initializeDatabase();
initializeArcRateLimiter();

await dev(import.meta.url, './main.ts', config);
