import { App, cors, csp, csrf, staticFiles } from 'fresh';
import { headers } from './middleware.ts';
import { ArcRateLimiter } from './lib/rate-limiting/src/arc-rate-limiter.ts';
import { ORIGIN, State } from './lib/types/common.ts';
import { NoteDatabase } from './lib/database/note-database.ts';
import { defaultLogger } from './lib/logging.ts';

const serverSecret = Deno.env.get('ARC_SECRET');
const databasePath = Deno.env.get('DATABASE_PATH');

if (!serverSecret) {
    throw new Error('ARC_SECRET environment variable is not set');
}

defaultLogger.log(`Database Path Source: ${databasePath ? 'env' : 'default'}`);

export const noteDatabase: NoteDatabase = await new NoteDatabase(databasePath).init();

// Configure rate limiter: 15 requests per minute, 5 min block duration
const rateLimiter = new ArcRateLimiter({
    maxRequests: 15,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
    identifier: 'vailnote-rate-limiter',
    serverSecret,
});

export const app = new App<State>()
    .use(staticFiles())
    .use(cors({
        origin: ORIGIN,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        maxAge: 86400,
    }))
    .use(csrf({
        origin: ORIGIN,
    }))
    .use(csp())
    .use(rateLimiter.middleware()) // 15 requests per minute, 5 min block
    .use(headers({
        'Cross-Origin-Resource-Policy': 'same-site',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Permissions-Policy':
            'geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    }))
    .fsRoutes();
